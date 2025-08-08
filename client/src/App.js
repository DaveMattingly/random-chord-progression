import './App.css';
import axios from 'axios';
import Tone from 'tone';
import {useState} from 'react';


function App() {
  const [seed, setSeed] = useState('');
  const [chords, setChords] = useState([]);
  const [notes, setNotes] = useState([]);

  const submitForm = async (seed) => {
    const API_BASE = process.env.API_URL || '';
    console.log(API_BASE);
    //const response = await axios.post(`${API_BASE}/query`, {
    const response = await axios.post(`http://localhost:3001/query`, {
      seed: seed,
    });

    const data = response.data;
    console.log(data)
    setChords(data.chords);
    setNotes(data.notes);
  };

  const playNotes = () => {
    const sampler = new Tone.Sampler({
      urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/casio/",
      onload: () => {
        sampler.triggerAttackRelease(["C1", "E1", "G1", "B1"], 0.5);
      }
    }).toDestination();
  }

  return (
    <div>
      <label for={"seed"}>Seed:</label>
      <input type={"text"}
             id={"seed"}
             value={seed}
             onChange={(e) => setSeed(e.target.value)}
      />
      <input type={"button"}
             id={"Randomize"}
             value={"Randomize Seed"}
      />
      <input type={"button"}
             id={"Go"}
             value={"Go!"}
             onClick={() => submitForm(seed)}
      />
      <textarea id={"chords"} value={chords}></textarea>
      <input type={"button"}
             id={"Play"}
             value={"Play"}
             onClick={() => playNotes()}
      />
    </div>
  );
}

export default App;
