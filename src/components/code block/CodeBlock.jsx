import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './CodeBlock.css';
import imgSmile from '../../images/smiley.svg';

// Dynamically determine the base URL
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
            setUserRole(storedRole.toString()); // Use the stored role if available
        } else {
            socket.emit('requestIsFirstUser', { codeBlockId: id });
            socket.on('recievedIsFirstUser', isFirstUser => {
                const userType = isFirstUser ? "mentor" : "student";
                setUserRole(userType);
                sessionStorage.setItem(`role-${id}`, userType.toString());
            });
        }

        return () => {
            socket.emit('leaveCodeBlockPage', { codeBlockId: id });
            socket.off('recievedIsFirstUser');
        };
    }, [id]);

    useEffect(() => {
        const handleTextUpdated = newText => {
            setText(newText);
        };

        socket.on(`textUpdated-${id}`, handleTextUpdated);

        return () => {
            socket.off(`textUpdated-${id}`, handleTextUpdated);
        };
    }, []);

    useEffect(() => {
        const saveCodeBlock = () => {
            axios.put(`${API_BASE_URL}/updateCodeBlock/${id}`, { code: text })
                .then(response => {
                    console.log('Code block updated:');
                })
                .catch(error => {
                    console.error('Error updating code block:', error);
                });
        };

        return () => {
            saveCodeBlock();
        };
    }, [text]);

    const debouncedEmitUpdateText = useCallback(newText => {
        socket.emit('updateText', { codeBlockId: id, text: newText });
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

    const handleOnClick = useCallback(() => {
        const parameterNames = file.functionParams? file.functionParams : '';
        const args = file.solutionArg? file.solutionArg: '';
        try {
            const dynamicFunction = new Function(...parameterNames, text);
    
            // Execute the function with the arguments
            const result = dynamicFunction(...args);
            var outputCorrect = false;
            if((result.toString()).toLowerCase() == (file.solutionOutput.toString()).toLowerCase()){
                outputCorrect =true;
            }
           setIsAnswerCorrect(outputCorrect);

        } catch (error) {
            console.error("Execution Error:", error);
        }
    }, [text]); 

    return (
        <div className="codeBlock">
            <div className="description">
                <Link to="/">
                    <button>Go Back</button>
                </Link>
                <h2>{file.title}</h2>
                <p>{file.explanation}</p>
            </div>
            <div className="editor">
                <p className="funcHead">{file.functionHeader}</p>
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
                <p className="funcHead">&#125;</p>
                
                {userRole != 'mentor' && (
                    <button className="runBtn" onClick={handleOnClick}>
                        Run Code
                    </button>
                )}
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