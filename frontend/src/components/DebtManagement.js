import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress, Box, Typography, Modal, TextField, Button } from '@mui/material';

const DebtManagement = () => {
    const [debts, setDebts] = useState([]);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const storedDebts = JSON.parse(localStorage.getItem('debts')) || [];
        setDebts(storedDebts);
    }, []);

    const handleTileClick = (debt) => {
        setSelectedDebt(debt);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDebt(null);
    };

    const handleDebtChange = (field, value) => {
        setSelectedDebt({ ...selectedDebt, [field]: value });
    };

    const handleSaveChanges = () => {
        const updatedDebts = debts.map((debt) =>
            debt.id === selectedDebt.id ? selectedDebt : debt
        );
        setDebts(updatedDebts);
        localStorage.setItem('debts', JSON.stringify(updatedDebts));
        handleModalClose();
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Debt Management</h2>
            <Link to="/add-debt">
                <button style={{ marginBottom: '20px', padding: '10px' }}>Add New Debt</button>
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {debts.map((debt) => {
                    const percentagePaid = (debt.paid / debt.balance) * 100 || 0;
                    const outstandingBalance = debt.balance - debt.paid;
                    return (
                        <div
                            key={debt.id}
                            onClick={() => handleTileClick(debt)}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                textAlign: 'center',
                                width: '250px',
                                cursor: 'pointer',
                            }}
                        >
                            <h3 style={{ marginBottom: '20px' }}>{debt.name || 'Unnamed Debt'}</h3>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: '20px',
                                }}
                            >
                                <CircularProgress
                                    variant="determinate"
                                    value={percentagePaid}
                                    size={200}
                                    thickness={6}
                                    style={{ color: '#4caf50' }}
                                />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="h6" component="div" color="textPrimary">
                                        P{outstandingBalance.toLocaleString()}
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        component="div"
                                        color="textPrimary"
                                        sx={{ fontWeight: 'bold', marginTop: '5px' }}
                                    >
                                        {debt.interestRate}%
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="div"
                                        sx={{ color: 'red', marginTop: '5px' }}
                                    >
                                        P{debt.minPayment.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    component="div"
                                    color="textSecondary"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        transform: 'translateY(-50%) translateX(180%)',
                                    }}
                                >
                                    <strong>{percentagePaid.toFixed(2)}%</strong>
                                </Typography>
                            </Box>
                        </div>
                    );
                })}
            </div>

            {/* Modal for Viewing and Editing Debt */}
            <Modal open={isModalOpen} onClose={handleModalClose}>
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        width: '400px',
                    }}
                >
                    {selectedDebt && (
                        <>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                                Edit Debt: {selectedDebt.name || 'Unnamed Debt'}
                            </h3>
                            <TextField
                                label="Debt Name"
                                fullWidth
                                margin="normal"
                                value={selectedDebt.name}
                                onChange={(e) => handleDebtChange('name', e.target.value)}
                            />
                            <TextField
                                label="Balance"
                                fullWidth
                                margin="normal"
                                type="number"
                                value={selectedDebt.balance}
                                onChange={(e) => handleDebtChange('balance', parseFloat(e.target.value) || 0)}
                            />
                            <TextField
                                label="Interest Rate (%)"
                                fullWidth
                                margin="normal"
                                type="number"
                                value={selectedDebt.interestRate}
                                onChange={(e) => handleDebtChange('interestRate', parseFloat(e.target.value) || 0)}
                            />
                            <TextField
                                label="Minimum Payment"
                                fullWidth
                                margin="normal"
                                type="number"
                                value={selectedDebt.minPayment}
                                onChange={(e) => handleDebtChange('minPayment', parseFloat(e.target.value) || 0)}
                            />
                            <TextField
                                label="Amount Paid"
                                fullWidth
                                margin="normal"
                                type="number"
                                value={selectedDebt.paid}
                                onChange={(e) => handleDebtChange('paid', parseFloat(e.target.value) || 0)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                <Button variant="contained" color="primary" onClick={handleSaveChanges}>
                                    Save
                                </Button>
                                <Button variant="outlined" color="secondary" onClick={handleModalClose}>
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default DebtManagement;