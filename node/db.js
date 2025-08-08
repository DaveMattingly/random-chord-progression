const Database = require('better-sqlite3');
const fs = require('fs');
const csv = require('csv-parser');

const db = new Database('chords.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS chords (
    id TEXT,
    prior TEXT,
    prob REAL
  )
`).run();
db.prepare(`DELETE FROM chords`).run();

fs.createReadStream("chords.csv")
    .pipe(csv())
    .on('data', (row) => {
        db.prepare("INSERT INTO chords VALUES (?,?,?)").run(row.ID, row.PRIOR, row.PROB);
        console.log(row);
    })

db.prepare(`
    CREATE TABLE IF NOT EXISTS chord_notes (
        id TEXT,
        notes TEXT,
        n_1 INTEGER,
        n_s1 INTEGER,
        n_2 INTEGER,
        n_s2 INTEGER,
        n_3 INTEGER,
        n_s3 INTEGER,
        n_4 INTEGER,
        n_s4 INTEGER,
        n_5 INTEGER,
        n_s5 INTEGER,
        n_6 INTEGER,
        n_s6 INTEGER,
        n_7 INTEGER,
        n_s7 INTEGER,
        name TEXT
    )
`).run();
db.prepare(`DELETE FROM chord_notes`).run();

fs.createReadStream("chord_notes.csv")
    .pipe(csv())
    .on('data', (row) => {
        db.prepare("INSERT INTO chord_notes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
            .run(row.ID,row.NOTES,row.N_1,row.N_S1,row.N_2,row.N_S2,row.N_3,row.N_S3,row.N_4,row.N_S4,row.N_5,row.N_S5,row.N_6,row.N_S6,row.N_7,row.N_S7,row.NAME);
        console.log(row);
    })
