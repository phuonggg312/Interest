document.addEventListener('DOMContentLoaded', loadHistory);

let deleteTarget = null; // Stores index for single delete or 'all' for clear all

function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount').value);
    const rateYear = parseFloat(document.getElementById('rate').value);
    const years = parseFloat(document.getElementById('years').value);

    if (!amount || !rateYear || !years) {
        alert("Please enter all fields.");
        return;
    }

    const totalMonths = years * 12;
    const rateMonth = (rateYear / 100) / 12;
    const principalPerMonth = amount / totalMonths;

    let remaining = amount;
    let totalInterest = 0;
    let schedule = [];

    for (let i = 1; i <= totalMonths; i++) {
        let interest = remaining * rateMonth;
        let total = principalPerMonth + interest;
        let before = remaining;
        remaining -= principalPerMonth;
        totalInterest += interest;

        schedule.push({
            period: i,
            balance: remaining,
            principal: principalPerMonth,
            interest: interest,
            total: total
        });
    }

    const totalPayable = amount + totalInterest;

    // Update Summary Card
    document.getElementById('totalInterestRes').innerText = `$${Math.round(totalInterest).toLocaleString()}`;
    document.getElementById('totalPayableRes').innerText = `$${Math.round(totalPayable).toLocaleString()}`;
    document.getElementById('resultSummary').classList.remove('hidden');

    // Build Detailed Table
    renderDetailedTable(schedule, amount, totalInterest, totalPayable);

    // Save to History
    saveHistory({ amount, rateYear, years, totalInterest, totalPayable });
}

function renderDetailedTable(schedule, amount, tInterest, tPayable) {
    let html = `
        <h3 class="font-bold my-4 text-gray-700">Repayment Schedule (Reducing Balance)</h3>
        <table class="w-full text-xs border border-gray-300">
            <thead class="bg-blue-600 text-white uppercase">
                <tr>
                    <th class="p-2 border">Period</th>
                    <th class="p-2 border">Remaining Principal</th>
                    <th class="p-2 border text-center">Principal Paid</th>
                    <th class="p-2 border text-center">Interest Paid</th>
                    <th class="p-2 border text-right">Total (P+I)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="p-2 border text-center">0</td>
                    <td class="p-2 border font-bold">${Math.round(amount).toLocaleString()}</td>
                    <td class="p-2 border text-center text-gray-400">-</td>
                    <td class="p-2 border text-center text-gray-400">-</td>
                    <td class="p-2 border text-right text-gray-400">-</td>
                </tr>`;

    schedule.forEach(row => {
        html += `
            <tr class="hover:bg-gray-50">
                <td class="p-2 border text-center">${row.period}</td>
                <td class="p-2 border">${Math.max(0, Math.round(row.balance)).toLocaleString()}</td>
                <td class="p-2 border text-center">${Math.round(row.principal).toLocaleString()}</td>
                <td class="p-2 border text-center text-red-500">${Math.round(row.interest).toLocaleString()}</td>
                <td class="p-2 border text-right font-bold text-blue-700">${Math.round(row.total).toLocaleString()}</td>
            </tr>`;
    });

    html += `
            <tr class="bg-gray-800 text-white font-bold text-sm">
                <td class="p-2 border" colspan="2">GRAND TOTAL</td>
                <td class="p-2 border text-center">${Math.round(amount).toLocaleString()}</td>
                <td class="p-2 border text-center text-yellow-400">${Math.round(tInterest).toLocaleString()}</td>
                <td class="p-2 border text-right text-green-400">${Math.round(tPayable).toLocaleString()}</td>
            </tr>
            </tbody>
        </table>`;

    document.getElementById('tableContainer').innerHTML = html;
}

// Modal Logic for Single Delete and Clear All
function openDeleteModal(index) {
    deleteTarget = index;
    document.getElementById('modalTitle').innerText = "Delete Record";
    document.getElementById('modalMessage').innerText = "Are you sure you want to remove this specific calculation from your history?";
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmBtn').onclick = executeDelete;
}

function openClearAllModal() {
    deleteTarget = 'all';
    document.getElementById('modalTitle').innerText = "Clear All History";
    document.getElementById('modalMessage').innerText = "This will permanently delete ALL calculation history. This action cannot be undone.";
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmBtn').onclick = executeDelete;
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    deleteTarget = null;
}

function executeDelete() {
    let history = JSON.parse(localStorage.getItem('loan_history')) || [];
    
    if (deleteTarget === 'all') {
        localStorage.removeItem('loan_history');
        document.getElementById('resultSummary').classList.add('hidden');
        document.getElementById('tableContainer').innerHTML = '';
    } else if (typeof deleteTarget === 'number') {
        history.splice(deleteTarget, 1);
        localStorage.setItem('loan_history', JSON.stringify(history));
    }
    
    loadHistory();
    closeModal();
}

function saveHistory(data) {
    let history = JSON.parse(localStorage.getItem('loan_history')) || [];
    history.unshift(data);
    localStorage.setItem('loan_history', JSON.stringify(history.slice(0, 10))); // Store last 10
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('loan_history')) || [];
    const container = document.getElementById('historyTable');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-400 italic">No history available</td></tr>';
        return;
    }

    history.forEach((item, index) => {
        container.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="p-3 font-bold">$${item.amount.toLocaleString()}</td>
                <td class="p-3 text-center">${item.rateYear}%</td>
                <td class="p-3 text-center">${item.years}</td>
                <td class="p-3 text-right text-red-500 font-medium">$${Math.round(item.totalInterest).toLocaleString()}</td>
                <td class="p-3 text-right font-black text-blue-600">$${Math.round(item.totalPayable).toLocaleString()}</td>
                <td class="p-3 text-center">
                    <button onclick="openDeleteModal(${index})" class="text-red-500 font-bold hover:scale-110 transition">✕</button>
                </td>
            </tr>`;
    });
}