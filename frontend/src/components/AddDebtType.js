import React from 'react';
import { useNavigate } from 'react-router-dom';

const AddDebtType = () => {
    const navigate = useNavigate();

    const handleSelection = (type) => {
        if (type === 'fixed') {
            navigate('/add-fixed-debt');
        } else if (type === 'revolving') {
            navigate('/add-revolving-debt');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Select Debt Type</h2>
            <button
                onClick={() => handleSelection('fixed')}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                }}
            >
                Fixed-Term Debt
            </button>
            <button
                onClick={() => handleSelection('revolving')}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                }}
            >
                Revolving Credit
            </button>
        </div>
    );
};

export default AddDebtType;
