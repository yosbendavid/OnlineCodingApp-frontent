import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './CodeBlock.css';
import imgSmile from '../../images/smiley.svg';

// Dynamically determine the base URL
// const API_BASE_URL = 'https://onlinecodingapp-backend-production.up.railway.app/';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Connect to the backend dynamically based on the environment
const socket = io(API_BASE_URL);

function CodeBlock() {
    const [file, setFile] = useState({});
    const [userRole, setUserRole] = useState(''); // Initialize the role state
    const { id } = useParams(); // Extract the id parameter from the URL
    const [text, setText] = useState();
    const [loading, setLoading] = useState();
    const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

    useEffect(() => {
        setLoading(true);

        console.log("api base url = " + API_BASE_URL)
        // Fetch specific code block data based on the id
        axios.get(`${API_BASE_URL}/getCodeBlock/${id}`)
            .then(response => {
                setFile(response.data);
                setText(response.data.code);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data: ', error);
                setLoading(false);
            });

        const storedRole = sessionStorage.getItem(`role-${id}`);
        socket.emit('accessCodeBlockPage', { codeBlockId: id });
        if (storedRole) {
            setUserRole(storedRole); // Use the stored role if available
        } else {
            socket.emit('requestIsFirstUser', { codeBlockId: id });
            socket.on('recievedIsFirstUser', isFirstUser => {
                const userType = isFirstUser ? "mentor" : "student";
                setUserRole(userType);
                sessionStorage.setItem(`role-${id}`, userType);
            });
        }

        // Emit an event when leaving the page
        const handleBeforeUnload = () => {
            socket.emit('leaveCodeBlockPage', { codeBlockId: id });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup: Remove event listener and disconnect socket when the component unmounts or id changes
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            socket.emit('leaveCodeBlockPage', { codeBlockId: id });
            socket.off('recievedIsFirstUser');
        };
    }, [id]);

    useEffect(() => {
        const handleTextUpdated = newText => {
            setText(newText);
        };

        socket.on('textUpdated', handleTextUpdated);

        return () => {
            socket.off('textUpdated', handleTextUpdated);
        };
    }, []);

    const debouncedEmitUpdateText = useCallback(newText => {
        socket.emit('updateText', newText);
    }, []);

    const debounce = (func, delay) => {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const handleOnChange = useCallback(
        debounce(value => {
            const newText = value.toString();
            setText(newText); // Update text locally immediately
            debouncedEmitUpdateText(newText); // Debounced emit to avoid too many socket events
        }, 500), // Adjust the delay time (in milliseconds) according to your preference
        [debouncedEmitUpdateText]
    );

    const handleOnClick = () => {
        const compareStrings = (str1, str2) => {
            const formattedStr1 = str1.replace(/\s/g, '').toLowerCase();
            const formattedStr2 = str2.replace(/\s/g, '').toLowerCase();
            return formattedStr1 === formattedStr2;
        };
        setIsAnswerCorrect(compareStrings(text, file.solution));
    };

    return (
        <div className="codeBlock">
            <div className="description">
                <Link to="/">
                    <button>Back</button>
                </Link>
                <h2>{file.title}</h2>
                <p>{file.explanation}</p>
                <p>{file.example}</p>
            </div>
            <div className="editor">
                <Editor
                    height="30vh"
                    theme="vs-dark"
                    onChange={handleOnChange}
                    defaultLanguage="javascript"
                    path={loading ? '' : file.title}
                    value={loading ? '' : text}
                    options={{
                        readOnly: userRole === 'mentor',
                        automaticLayout: true,
                        minimap: {
                            enabled: false
                        },
                        contextmenu: false
                    }}
                />
                <button onClick={handleOnClick}>
                    Run
                </button>
            </div>
            {isAnswerCorrect && (
                <div className="answerCorrect">
                    <img src={imgSmile} alt="smile" />
                </div>
            )}
        </div>
    );
}

export default CodeBlock;