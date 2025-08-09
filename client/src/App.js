import './App.css';
import axios from 'axios';
import * as Tone from 'tone';
import * as Flow from 'vexflow';
import {useState} from 'react';


function App() {
    const [seed, setSeed] = useState('');
    const [chords, setChords] = useState([]);
    const [notes, setNotes] = useState([]);
    const [showInfo, setShowInfo] = useState(false);

    const randomizeSeed = () => {
        const newSeed= Math.floor(Math.random() * 10000000)
        setSeed(newSeed);
        submitForm(newSeed);
    };

    const splitChord = (chord) => {
        const bass = [];
        const treble = [];

        for (let i = 0; i < chord.length; i++) {
            const octave = parseInt(chord[i].slice(-1));
            //if (octave < 4 || chord[i] === 'C4') {
            if (i===0) {
                bass.push(chord[i]);
            } else {
                treble.push(chord[i]);
            }
        }

        return { bass, treble };
    };

    const formatVoiceArray = (voiceArray) => {
        return voiceArray
            .map(notes => {
                if (notes.length === 0) {
                    return 'b4/q/r'; // rest
                } else if (notes.length === 1) {
                    return `${notes[0]}/q`;
                } else {
                    const formattedNotes = notes.join(' ');
                    return `(${formattedNotes})/q`;
                }
            })
            .join(', ');
    };


    const submitForm = async (seed) => {
        const API_BASE = process.env.API_URL || '';
        //console.log(API_BASE);
        const response = await axios.post(`${API_BASE}/query`, {
        //const response = await axios.post("http://localhost:3001/query", {
            seed: seed
        });

    const data = response.data;
    setChords(data.chords);
    setNotes(data.notes);

    const trebleNotes = [];
    const bassNotes = [];

    for(let i = 0; i < data.notes.length; i++) {
        const {bass, treble} = splitChord(data.notes[i]);
        bassNotes.push(bass);
        trebleNotes.push(treble);
    }

    const { Factory, StaveConnector, Voice } = Flow;

    document.getElementById("vex").innerHTML = "";

    const vf = new Factory({
        renderer: {
            elementId: "vex",
            width: 900,
            height: 300,
        },
    });

    const score = vf.EasyScore();
    const system = vf.System({ x: 50, y: 50, width: 849, spaceBetweenStaves: 10 });

    const treblevoice = vf.Voice({num_beats: trebleNotes.length, beat_value: 4, resolution: vf.RESOLUTION});
    treblevoice.setStrict(false);
    treblevoice.addTickables(score.notes(formatVoiceArray(trebleNotes), {stem: 'up'}));


    const bassvoice = vf.Voice({num_beats: bassNotes.length, beat_value: 4, resolution: vf.RESOLUTION});
    bassvoice.setStrict(false);
    bassvoice.addTickables(score.notes(formatVoiceArray(bassNotes), {stem: 'down', clef: 'bass'}));

    // Treble staff
    system
        .addStave({
            voices: [treblevoice],
        })
        .addClef('treble');

    // Bass staff
    system
        .addStave({
            voices: [bassvoice],
        })
        .addClef('bass');

    // Connect staves
    system.addConnector().setType(StaveConnector.type.BRACE);
    system.addConnector().setType(StaveConnector.type.SINGLE_LEFT);
    system.addConnector().setType(StaveConnector.type.SINGLE_RIGHT);

    vf.draw();

};

const playNotes = () => {
    const sampler = new Tone.Sampler({
        urls: {
            A0: "A0.mp3",
            C1: "C1.mp3",
            "D#1": "Ds1.mp3",
            "F#1": "Fs1.mp3",
            A1: "A1.mp3",
            C2: "C2.mp3",
            "D#2": "Ds2.mp3",
            "F#2": "Fs2.mp3",
            A2: "A2.mp3",
            C3: "C3.mp3",
            "D#3": "Ds3.mp3",
            "F#3": "Fs3.mp3",
            A3: "A3.mp3",
            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            A4: "A4.mp3",
            C5: "C5.mp3",
            "D#5": "Ds5.mp3",
            "F#5": "Fs5.mp3",
            A5: "A5.mp3",
            C6: "C6.mp3",
            "D#6": "Ds6.mp3",
            "F#6": "Fs6.mp3",
            A6: "A6.mp3",
            C7: "C7.mp3",
            "D#7": "Ds7.mp3",
            "F#7": "Fs7.mp3",
            A7: "A7.mp3",
            C8: "C8.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        onload: () => {
            Tone.Transport.cancel();
            sampler.releaseAll();          // Stop currently playing notes
            Tone.Transport.stop();         // Stop the transport clock

            const now = Tone.now();
            for(let i = 0; i < notes.length; i++){
                sampler.triggerAttack(notes[i], now + i);
                sampler.triggerRelease(now + i + 1);

            }
        }
    }).toDestination();
}

return (
    <div className={"app-container"}>
        <div className="info-button" onClick={() => setShowInfo(true)}>?️</div>

        {showInfo && (
            <div className="modal-overlay" onClick={() => setShowInfo(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={() => setShowInfo(false)}>×</button>
                    <h2>Random Chord Progression Generator</h2>
                    <p>This tool generates a random chord progressing in C Major, based upon data provided by <a href={"https://www.hooktheory.com/trends"}>Hooktheory Trends</a>.</p>
                    <p>The tool uses a seeded random generator, allowing you to save a seed and regenerate it later if you find a progression that you like.</p>
                    <p>While it's unlikely that an entire progression will sound good, my hope is that a chord transition or two could inspire further composition.</p>
                    <p>Built by <a href={"https://github.com/DaveMattingly"}>Dave Mattingly</a> using Node.js, React, tone.js, and Vexflow.</p>
                </div>
            </div>
        )}
        <div className={"controls"}>
            <label htmlFor={"seed"}>Seed:</label>
            <input type={"text"}
                   id={"seed"}
                   value={seed}
                   onChange={(e) => setSeed(e.target.value)}
            />
            <input type={"button"}
                   value={"Generate From Seed"}
                   onClick={() => submitForm(seed)}
            />
            <input type={"button"}
                   value={"Generate Random Progression"}
                   onClick={() => randomizeSeed()}
            />
            <input type={"button"}
                   value={"Play Progression"}
                   onClick={() => playNotes()}
            />
        </div>
        <div id={"chords-display"}>{Array.isArray(chords) ? chords.join(', ') : chords}</div>

        <div id={"vex"}></div>
    </div>
);
}

export default App;