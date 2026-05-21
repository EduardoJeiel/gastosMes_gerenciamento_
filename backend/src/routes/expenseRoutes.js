const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/expenses', expenseController.getExpensesByMonth);
router.post('/expenses/batch', expenseController.batchSave.bind(expenseController));
router.post('/expenses/send-report', expenseController.sendReport.bind(expenseController));
router.put('/expenses/salary', expenseController.updateSalary.bind(expenseController));
router.delete('/expenses/:id', expenseController.deleteExpense);

module.exports = router;