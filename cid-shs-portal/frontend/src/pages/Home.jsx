import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home(){
  const [files, setFiles] = useState([]);

  useEffect(()=>{
    fetch('/api/uploads')
      .then(res => res.json())
      .then(setFiles)
      .catch(()=>setFiles([]));
  },[]);

  return (
    <main className={styles.container}>
      <h1>Home</h1>
      <p>Uploaded PDFs:</p>
      <ul>
        {files.length === 0 && <li>No PDFs found. Add files to backend/uploads/</li>}
        {files.map(f => (
          <li key={f}>
            <a href={`/uploads/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer">{f}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
