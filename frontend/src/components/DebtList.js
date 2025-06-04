import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Typography, Card, CardContent, LinearProgress, Button, Box, 
    Grid, FormControl, InputLabel, Select, MenuItem, Stack, TextField
} from '@mui/material';
import { Add, ArrowUpward, ArrowDownward } from '@mui/icons-material';

const DebtList = () => {
    const [debts, setDebts] = useState([]);
    const [sortField, setSortField] = useState('balance');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const response = await fetch('/api/debts', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch debts');
                const data = await response.json();
                setDebts(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchDebts();
    }, []);

    const calculateProgress = (debt) => {
        if (debt.type === 'revolving') {
            return (1 - (debt.balance / (debt.debt_limit || 1))) * 100;
        }
        return ((debt.original_amount - debt.balance) / (debt.original_amount || 1)) * 100;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">My Debts</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    component={Link}
                    to="/add-debt-type"
                >
                    Add New Debt
                </Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Stack direction="row" spacing={1}>
                    {/* ...existing sorting/filtering controls from DebtManagement... */}
                </Stack>
            </Box>

            <Grid container spacing={3}>
                {debts.map((debt) => (
                    <Grid item xs={12} sm={6} md={4} key={debt.id}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 6 }
                            }}
                            onClick={() => navigate(`/debt-details/${debt.id}`)}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {debt.name}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {debt.category}
                                </Typography>
                                <Typography variant="h5" component="div">
                                    P{parseFloat(debt.balance).toLocaleString('en-BW')}
                                </Typography>
                                <Typography color="textSecondary">
                                    {debt.interest_rate}% APR
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={calculateProgress(debt)}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: '#4caf50'
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Minimum Payment: P{parseFloat(debt.min_payment).toLocaleString('en-BW')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="outlined"
                    component={Link}
                    to="/debt-management"
                >
                    Back to Dashboard
                </Button>
            </Box>
        </div>
    );
};

export default DebtList;
