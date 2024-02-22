import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './CodeBlock.css';
import imgSmile from '../images/smiley.svg';

// Determine the base URL dynamically
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://onlinecodingapp.up.railway.app' // Production API URL
    : 'http://localhost:3001'; // Development API URL

const socket = io(API_BASE_URL); // Connect to your backend dynamically based on environment

function CodeBlock() {
    const [file, setFile] = useState({});
    const editorRef = useRef(null);
    const [userRole, setUserRole] = useState(''); // Initialize your role state here
    const { id } = useParams(); // Extract the id parameter from the URL,,,
    const [text, setText] = useState();
    const [loading, setLoading] = useState();
    const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

    useEffect(() => {
        setLoading(true);

        // Fetch the specific code block data based on the id
        axios.get(`${ API_BASE_URL }/getCodeBlock/${ id }`)
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
            console.log("Your Role is: " + storedRole.toString())
            setUserRole(storedRole); // Use the stored role
        } else {
            socket.emit('requestIsFirstUser', { codeBlockId: id })
            socket.on('recievedIsFirstUser', isFirstUser => {
                let userType;
                console.log("recieved is first user")
                if (isFirstUser) {
                    userType = "mentor"
                }
                else {
                    userType = "student"
                }
                console.log("setting user to= " + userType)
                setUserRole(userType);
                sessionStorage.setItem(`role-${id}`, userType.toString());
            })
        }

        // Function to emit an event when leaving the page
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
    }, [id])

    useEffect(() => {
        const handleTextUpdated = newText => {
            setText(newText);
        };

        socket.on('textUpdated', handleTextUpdated);

        return () => {
            socket.off('textUpdated', handleTextUpdated);
        };
    }, []);

    const debouncedEmitUpdateText = useCallback((newText) => {
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
        debounce((value) => {
            const newText = value.toString();
            setText(newText); // Update text locally immediately
            debouncedEmitUpdateText(newText); // Debounced emit to avoid too many socket events
        }, 500), // Adjust the delay time (in milliseconds) according to your preference
        [debouncedEmitUpdateText]
    );

    const handleOnClick = () => {
        function compareStrings(str1, str2) {
            // Remove whitespace and convert strings to lowercase
            const formattedStr1 = str1.replace(/\s/g, '').toLowerCase();
            const formattedStr2 = str2.replace(/\s/g, '').toLowerCase();

            // Compare the formatted strings
            if (formattedStr1 === formattedStr2) {
                return true; // Strings are the same after removing spaces and case sensitivity
            } else {
                return false; // Strings are different
            }
        }
        compareStrings(text, file.solution) ? setIsAnswerCorrect(true) : setIsAnswerCorrect(true);
    }

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
            {isAnswerCorrect ?
                <div className="answerCorrect">
                    <img src={imgSmile} alt='smile' />
                </div>
                : null
            }
        </div>
    );
}

export default CodeBlock;