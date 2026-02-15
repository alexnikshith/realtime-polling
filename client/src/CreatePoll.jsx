import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!question.trim()) {
            setError('Question is required');
            return;
        }

        const validOptions = options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            setError('Please provide at least 2 valid options');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/polls`, {
                question,
                options: validOptions
            });
            navigate(`/poll/${response.data.id}`);
        } catch (err) {
            setError('Failed to create poll. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="create-poll-container">
            <h2>Create a New Poll</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Question:</label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What is your favorite programming language?"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Options:</label>
                    {options.map((option, index) => (
                        <div key={index} className="option-input">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                required
                            />
                            {options.length > 2 && (
                                <button type="button" onClick={() => removeOption(index)} className="remove-btn">
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addOption} className="add-option-btn">
                        + Add Option
                    </button>
                </div>

                <button type="submit" className="submit-btn">Create Poll</button>
            </form>
        </div>
    );
};

export default CreatePoll;
