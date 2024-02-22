import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import './Lobby.css'

// const API_BASE_URL = 'https://onlinecodingapp-backend-production.up.railway.app/';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CodeBlocks = () => {
  const [codeBlocks, setCodeBlocks] = useState([]);

  useEffect(() => {
    console.log("api base url = " + API_BASE_URL)

    axios.get(`${API_BASE_URL}/getAllCodeBlocks`)
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