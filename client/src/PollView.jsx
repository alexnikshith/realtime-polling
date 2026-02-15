import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const PollView = () => {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [notification, setNotification] = useState('');

    // Generate a simple fingerprint (can be improved)
    const getFingerprint = () => {
        let fingerprint = sessionStorage.getItem('poll_app_fingerprint');
        if (!fingerprint) {
            fingerprint = Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem('poll_app_fingerprint', fingerprint);
        }
        return fingerprint;
    };

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/polls/${id}`);
                setPoll(response.data);

                // Check session storage for vote status specific to this poll
                const votedPolls = JSON.parse(sessionStorage.getItem('voted_polls') || '[]');
                if (votedPolls.includes(id)) {
                    setHasVoted(true);
                }
            } catch (err) {
                setError('Poll not found or server error.');
            } finally {
                setLoading(false);
            }
        };

        fetchPoll();

        // Socket.io listeners
        socket.emit('join_poll', id);

        socket.on('update_results', (data) => {
            setPoll((prevPoll) => {
                if (!prevPoll) return prevPoll;
                return { ...prevPoll, votes: data.votes };
            });
        });

        return () => {
            socket.off('update_results');
        };
    }, [id]);

    const handleVote = async (index) => {
        if (hasVoted) return;

        try {
            const fingerprint = getFingerprint();
            const response = await axios.post(`${API_URL}/api/polls/${id}/vote`, {
                optionIndex: index,
                fingerprint
            });

            setHasVoted(true);
            setNotification('Vote submitted successfully!');

            // Update local votes immediately from response
            if (response.data.votes) {
                setPoll(prev => ({ ...prev, votes: response.data.votes }));
            }

            // Update session storage
            const votedPolls = JSON.parse(sessionStorage.getItem('voted_polls') || '[]');
            if (!votedPolls.includes(id)) {
                votedPolls.push(id);
                sessionStorage.setItem('voted_polls', JSON.stringify(votedPolls));
            }

        } catch (err) {
            setNotification(err.response?.data?.error || 'Failed to submit vote.');
            // If error is "already voted", update UI state
            if (err.response?.status === 403) {
                setHasVoted(true);
            }
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setNotification('Link copied to clipboard!');
        setTimeout(() => setNotification(''), 3000);
    };

    if (loading) return <div className="loading">Loading poll...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!poll) return null;

    // Prepare data for chart
    const chartData = poll.options.map((opt, index) => ({
        name: opt,
        votes: poll.votes ? poll.votes[index] : 0
    }));

    const totalVotes = poll.votes ? poll.votes.reduce((a, b) => a + b, 0) : 0;

    return (
        <div className="poll-view-container">
            <div className="poll-header">
                <h2>{poll.question}</h2>
                <button onClick={copyLink} className="share-btn">🔗 Share Poll</button>
            </div>

            {notification && <div className="notification">{notification}</div>}

            <div className="poll-content">
                <div className="voting-section">
                    <h3>Vote Here</h3>
                    <div className="options-list">
                        {poll.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleVote(index)}
                                disabled={hasVoted}
                                className={`vote-btn ${hasVoted ? 'disabled' : ''}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {hasVoted && <p className="voted-msg">You have voted! Watch real-time results below.</p>}
                </div>

                <div className="results-section">
                    <h3>Live Results ({totalVotes} votes)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={100}
                                    tick={{ fill: '#94a3b8', fontSize: 13 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="votes" radius={[0, 6, 6, 0]} barSize={32}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PollView;
