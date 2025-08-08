const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database('chords.db');
const seedrandom = require('seedrandom');
const tonal = require("tonal");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors()); // Allow frontend access
app.use(express.json());

function getNextChord(prior, rng) {
    let chords = [];
    let weights = [];

    const results = db.prepare(`
    SELECT c.ID, c.PROB FROM chords c inner join chord_notes n on c.ID = n.ID 
    WHERE prior = ?`).all(prior);

    results.forEach((row) => {
        chords.push(row.id);
        weights.push(row.prob);
    });

    const sum = weights.reduce((acc, cur) => {return acc + cur;}, 0);
    weights = weights.map(num => num / sum);

    let chord_rng = rng();
    let i = 0;
    while (weights[i] < chord_rng) {
        chord_rng -= weights[i];
        i += 1;
    }

    return chords[i];

}

function translateChords(chords) {
    const names = []
    for (let i = 0; i < chords.length; i++) {
        const row = db.prepare(`
            SELECT NAME FROM chord_notes
            WHERE id = ?`).get(chords[i]);
        names.push(row.name);
    }
    return names;
}

function getVoicesFromChords(chordNames) {
    let voices = [];
    for (let i = 0; i < chordNames.length; i++) {
        notes = tonal.Chord.get(chordNames[i]).notes
        if (notes.length === 3) {
            notes.unshift(tonal.Chord.get(chordNames[i]).notes[0])
        }
        voices.push(notes);
    }
    return voices;
}

function assignNotesToVoices(voices) {
    voices[0] = ["C3", "C4", "E4", "G4"] //Always starting on C Major

    for (let i = 1; i < voices.length; i++) {

        //Find Bass Note
        let bass_notes = [voices[i][0] + "2", voices[i][0] + "3", voices[i][0] + "4"];
        bass_notes = bass_notes.map(note => Math.abs(tonal.Interval.semitones(tonal.Interval.distance(voices[i - 1][0], note))));
        if (tonal.Note.freq("F2") > tonal.Note.freq(voices[i][0] + "2")) {
            bass_notes[0] = 999;
        }
        if (tonal.Note.freq("C4") < tonal.Note.freq(voices[i][0] + "4")) {
            bass_notes[2] = 999;
        }
        if (bass_notes[0] < bass_notes[1] && bass_notes[0] < bass_notes[2]) {
            voices[i][0] += "2";
        } else if (bass_notes[1] < bass_notes[2]) {
            voices[i][0] += "3";
        } else {
            voices[i][0] += "4";
        }

        //Find Soprano Note
        let soprano_notes = [voices[i][1] + "4", voices[i][2] + "4", voices[i][3] + "4", voices[i][1] + "5", voices[i][2] + "5", voices[i][3] + "5"];
        soprano_notes = soprano_notes.map(note => Math.abs(tonal.Interval.semitones(tonal.Interval.distance(voices[i - 1][3], note))));
        if (soprano_notes[5] === Math.min(...soprano_notes)) {
            voices[i][3] += "5";
        } else if (soprano_notes[4] === Math.min(...soprano_notes)) {
            [voices[i][2], voices[i][3]] = [voices[i][3], voices[i][2] + "5"];
        } else if (soprano_notes[3] === Math.min(...soprano_notes)) {
            [voices[i][1], voices[i][3]] = [voices[i][3], voices[i][1] + "5"];
        } else if (soprano_notes[2] === Math.min(...soprano_notes)) {
            voices[i][3] += "4";
        } else if (soprano_notes[1] === Math.min(...soprano_notes)) {
            [voices[i][2], voices[i][3]] = [voices[i][3], voices[i][2] + "4"];
        } else {
            [voices[i][1], voices[i][3]] = [voices[i][3], voices[i][1] + "4"];
        }

        //Find Tenor Note
        let tenor_notes = [voices[i][1] + "3", voices[i][2] + "3", voices[i][1] + "4", voices[i][2] + "4"];
        tenor_notes = tenor_notes.map(note => Math.abs(tonal.Interval.semitones(tonal.Interval.distance(voices[i - 1][1], note))));
        if (tenor_notes[3] === Math.min(...tenor_notes)) {
            [voices[i][2], voices[i][1]] = [voices[i][1], voices[i][2] + "4"];
        } else if (tenor_notes[2] === Math.min(...tenor_notes)) {
            voices[i][1] += "4";
        } else if (tenor_notes[1] === Math.min(...tenor_notes)) {
            [voices[i][2], voices[i][1]] = [voices[i][1], voices[i][2] + "3"];
        } else {
            voices[i][1] += "3";
        }

        //Find Alto Note
        let alto_notes = [voices[i][2] + "3", voices[i][2] + "4", voices[i][2] + "5"];
        alto_notes = alto_notes.map(note => Math.abs(tonal.Interval.semitones(tonal.Interval.distance(voices[i - 1][2], note))));
        if (tonal.Note.freq("F3") > tonal.Note.freq(voices[i][2] + "3")) {
            alto_notes[0] = 999;
        }
        if (tonal.Note.freq("D5") < tonal.Note.freq(voices[i][2] + "3")) {
            alto_notes[2] = 999;
        }
        if (alto_notes[0] < alto_notes[1] && alto_notes[0] < alto_notes[2]) {
            voices[i][2] += "3";
        } else if (alto_notes[1] < alto_notes[2]) {
            voices[i][2] += "4";
        } else {
            voices[i][2] += "5";
        }

    }
    return voices;
}

app.post('/query', (req, res) => {
    let chordList = [];
    let chordNames = [];

    const rng = seedrandom(req.body.seed || 0);

    chordList.push("1"); //Start on C Major
    while((chordList.length < 16 || chordList[chordList.length - 1] != "1") && chordList.length < 32) {
        const nextChord = getNextChord(chordList[chordList.length - 1], rng)
        chordList.push(nextChord);
    }

    chordNames = translateChords(chordList);
    let voices = getVoicesFromChords(chordNames);

    voices = assignNotesToVoices(voices);

    let responsePayload = {}
    responsePayload["chords"] = chordNames;
    responsePayload["notes"] = voices;
    console.log(responsePayload);
    res.json(responsePayload || {});
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'))
});

app.listen(PORT, () => console.log('API running on port', PORT));