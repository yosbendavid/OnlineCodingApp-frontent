import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import './Lobby.css'

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://onlinecodingapp.up.railway.app' // Production API URL
    : 'http://localhost:3001'; // Development API URL

const CodeBlocks = () => {
  const [codeBlocks, setCodeBlocks] = useState([]);

  useEffect(() => {
    axios.get(`${ API_BASE_URL }/getAllCodeBlocks`)
      .then(response => {
        setCodeBlocks(response.data);
      })
      .catch(error => console.error('Error fetching data: ', error));
  }, []);

  return (
    <div className='lobby'>
      <header>
        <h1>Learning Code</h1>
      </header>
      <main>
        <ul className="problems">
          {codeBlocks.map((block, index) => (
            <Link key={index} to={`/codeBlock/${block._id}`}>
              <li className={block.id}>
                <p>{block.title}</p>
              </li>
            </Link>
          ))}
        </ul>
      </main>
    </div>
  );  
}

export default CodeBlocks;