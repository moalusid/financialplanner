import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const BudgetCalculator = () => {
    const [incomes, setIncomes] = useState([{ id: 1, source: '', amount: 0 }]);
    const [expenses, setExpenses] = useState({
        Essentials: {
            Housing: [{ id: 1, description: '', amount: 0 }],
            Utilities: [{ id: 1, description: '', amount: 0 }],
            Groceries: [{ id: 1, description: '', amount: 0 }],
            Transportation: [{ id: 1, description: '', amount: 0 }]
        },
        Lifestyle: {
            DiningOut: [{ id: 1, description: '', amount: 0 }],
            Entertainment: [{ id: 1, description: '', amount: 0 }],
            Shopping: [{ id: 1, description: '', amount: 0 }],
            HealthFitness: [{ id: 1, description: '', amount: 0 }]
        },
        Financial: {
            DebtPayments: [{ id: 1, description: '', amount: 0 }],
            Savings: [{ id: 1, description: '', amount: 0 }],
            Insurance: [{ id: 1, description: '', amount: 0 }]
        },
        Other: [{ id: 1, description: '', amount: 0 }]
    });
    const [remainingBudget, setRemainingBudget] = useState(null);
    const [chartData, setChartData] = useState([]);

    const addIncomeLine = () => {
        setIncomes([...incomes, { id: incomes.length + 1, source: '', amount: 0 }]);
    };

    const addExpenseLine = (category, subcategory) => {
        const updatedExpenses = { ...expenses };
        if (subcategory) {
            updatedExpenses[category][subcategory].push({
                id: updatedExpenses[category][subcategory].length + 1,
                description: '',
                amount: 0
            });
        } else {
            updatedExpenses[category].push({
                id: updatedExpenses[category].length + 1,
                description: '',
                amount: 0
            });
        }
        setExpenses(updatedExpenses);
    };

    const calculateBudget = () => {
        const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = Object.keys(expenses).reduce((sum, category) => {
            if (category === 'Other') {
                return sum + expenses[category].reduce((subSum, expense) => subSum + expense.amount, 0);
            }
            return sum + Object.keys(expenses[category]).reduce((subSum, subcategory) => {
                return subSum + expenses[category][subcategory].reduce((itemSum, item) => itemSum + item.amount, 0);
            }, 0);
        }, 0);
        setRemainingBudget(totalIncome - totalExpenses);

        const chartData = Object.keys(expenses).flatMap((category) => {
            if (category === 'Other') {
                const otherTotal = expenses[category].reduce((sum, expense) => sum + expense.amount, 0);
                return [['Other', otherTotal]];
            }
            return Object.keys(expenses[category]).map((subcategory) => {
                const subcategoryTotal = expenses[category][subcategory].reduce((sum, expense) => sum + expense.amount, 0);
                return [subcategory, subcategoryTotal];
            });
        });
        setChartData([['Category', 'Amount'], ...chartData]);
    };

    return (
        <div>
            <Link to="/">Back to Homepage</Link>
            <h2>Budget Calculator</h2>

            <h3>Income</h3>
            {incomes.map((income, index) => (
                <div key={income.id}>
                    <input
                        type="text"
                        placeholder={`Source ${index + 1}`}
                        onChange={(e) => {
                            const updatedIncomes = incomes.map((inc) =>
                                inc.id === income.id ? { ...inc, source: e.target.value } : inc
                            );
                            setIncomes(updatedIncomes);
                        }}
                    />
                    <input
                        type="number"
                        placeholder={`Amount ${index + 1}`}
                        onChange={(e) => {
                            const updatedIncomes = incomes.map((inc) =>
                                inc.id === income.id ? { ...inc, amount: parseFloat(e.target.value) || 0 } : inc
                            );
                            setIncomes(updatedIncomes);
                        }}
                    />
                </div>
            ))}
            <button onClick={addIncomeLine}>Add Income</button>

            <h3>Expenses</h3>
            {Object.keys(expenses).map((category) => (
                <div key={category}>
                    <h4>{category}</h4>
                    {category === 'Other'
                        ? expenses[category].map((expense, index) => (
                              <div key={expense.id}>
                                  <input
                                      type="text"
                                      placeholder={`Description ${index + 1}`}
                                      onChange={(e) => {
                                          const updatedOther = expenses[category].map((exp) =>
                                              exp.id === expense.id ? { ...exp, description: e.target.value } : exp
                                          );
                                          setExpenses({ ...expenses, Other: updatedOther });
                                      }}
                                  />
                                  <input
                                      type="number"
                                      placeholder={`Amount ${index + 1}`}
                                      onChange={(e) => {
                                          const updatedOther = expenses[category].map((exp) =>
                                              exp.id === expense.id ? { ...exp, amount: parseFloat(e.target.value) || 0 } : exp
                                          );
                                          setExpenses({ ...expenses, Other: updatedOther });
                                      }}
                                  />
                              </div>
                          ))
                        : Object.keys(expenses[category]).map((subcategory) => (
                              <div key={subcategory}>
                                  <h5>{subcategory}</h5>
                                  {expenses[category][subcategory].map((expense, index) => (
                                      <div key={expense.id}>
                                          <input
                                              type="text"
                                              placeholder={`Description ${index + 1}`}
                                              onChange={(e) => {
                                                  const updatedSubcategory = expenses[category][subcategory].map((exp) =>
                                                      exp.id === expense.id
                                                          ? { ...exp, description: e.target.value }
                                                          : exp
                                                  );
                                                  setExpenses({
                                                      ...expenses,
                                                      [category]: {
                                                          ...expenses[category],
                                                          [subcategory]: updatedSubcategory
                                                      }
                                                  });
                                              }}
                                          />
                                          <input
                                              type="number"
                                              placeholder={`Amount ${index + 1}`}
                                              onChange={(e) => {
                                                  const updatedSubcategory = expenses[category][subcategory].map((exp) =>
                                                      exp.id === expense.id
                                                          ? { ...exp, amount: parseFloat(e.target.value) || 0 }
                                                          : exp
                                                  );
                                                  setExpenses({
                                                      ...expenses,
                                                      [category]: {
                                                          ...expenses[category],
                                                          [subcategory]: updatedSubcategory
                                                      }
                                                  });
                                              }}
                                          />
                                      </div>
                                  ))}
                                  <button onClick={() => addExpenseLine(category, subcategory)}>
                                      Add {subcategory} Expense
                                  </button>
                              </div>
                          ))}
                </div>
            ))}
            <button onClick={() => addExpenseLine('Other')}>Add Other Expense</button>

            <button onClick={calculateBudget}>Calculate</button>
            {remainingBudget !== null && <p>Remaining Budget: {remainingBudget}</p>}

            {chartData.length > 0 && (
                <Chart
                    chartType="PieChart"
                    data={chartData}
                    options={{ title: 'Expense Distribution' }}
                    width="100%"
                    height="400px"
                />
            )}
        </div>
    );
};

export default BudgetCalculator;