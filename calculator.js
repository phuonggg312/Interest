document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', formatNumberInput);
        amountInput.addEventListener('blur', formatNumberInput);
    }
});

let deleteTarget = null;

function calculateLoan() {
    const rawAmount = document.getElementById('amount').value;
    const amount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
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
        remaining -= principalPerMonth;
        
        let safeBalance = Math.abs(remaining) < 0.1 ? 0 : remaining;
        totalInterest += interest;

        schedule.push({
            period: i,
            balance: safeBalance,
            principal: principalPerMonth,
            interest: interest,
            total: total
        });
    }

    const totalPayable = amount + totalInterest;
    document.getElementById('totalInterestRes').innerText = `$${Math.round(totalInterest).toLocaleString()}`;
    document.getElementById('totalPayableRes').innerText = `$${Math.round(totalPayable).toLocaleString()}`;
    document.getElementById('resultSummary').classList.remove('hidden');

    renderDetailedTable(schedule, amount);
    saveHistory({ amount, rateYear, years, totalInterest, totalPayable }, schedule);
}

function renderDetailedTable(schedule, amount) {
    const yearlyData = {};
    schedule.forEach(row => {
        const year = Math.ceil(row.period / 12);
        if (!yearlyData[year]) yearlyData[year] = { months: [], principal: 0, interest: 0, total: 0 };
        yearlyData[year].months.push(row);
        yearlyData[year].principal += row.principal;
        yearlyData[year].interest += row.interest;
        yearlyData[year].total += row.total;
    });

    let html = `
        <h3 class="font-bold my-4 text-gray-700 uppercase text-xs flex items-center gap-2 px-2 border-l-4 border-blue-600 pl-3">
            Detailed Schedule
        </h3>
        <div class="overflow-hidden rounded border border-gray-300 shadow-sm">
            <table class="w-full text-[11px] border-collapse bg-white">
                <thead class="bg-blue-600 text-white uppercase font-bold">
                    <tr>
                        <th class="p-3 w-16 border-r border-blue-500 text-center">Year</th>
                        <th class="p-3 w-16 border-r border-blue-500 text-center">Month</th>
                        <th class="p-3 border-r border-blue-500 text-center">Remaining Principal</th>
                        <th class="p-3 border-r border-blue-500 text-center">Principal Paid</th>
                        <th class="p-3 border-r border-blue-500 text-center">Interest Paid</th>
                        <th class="p-3 text-center">Total (P+I)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-gray-50 font-bold border-b">
                        <td class="p-2 border-r font-black text-center">0</td>
                        <td class="p-2 border-r text-center">-</td>
                        <td class="p-2 border-r font-bold text-gray-800 text-center">${Math.round(amount).toLocaleString()}</td>
                        <td class="p-2 border-r text-gray-400 font-normal text-center">-</td>
                        <td class="p-2 border-r text-gray-400 font-normal text-center">-</td>
                        <td class="p-2 text-gray-400 font-normal text-center">-</td>
                    </tr>`;

    Object.keys(yearlyData).forEach(year => {
        const data = yearlyData[year];
        
        html += `
            <tr class="bg-blue-50 cursor-pointer hover:bg-blue-100 transition border-y border-blue-200 font-bold" onclick="toggleYear(${year})">
                <td class="p-3 text-blue-700 border-r border-blue-200 font-black text-center">${year}</td>
                <td class="p-3 text-gray-400 border-r border-blue-200 italic font-medium text-center">-</td>
                <td class="p-3 text-gray-400 border-r border-blue-200 font-normal text-center">---</td>
                <td class="p-3 border-r border-blue-200 font-black text-center">${Math.round(data.principal).toLocaleString()}</td>
                <td class="p-3 border-r border-blue-200 font-black text-red-600 text-center">${Math.round(data.interest).toLocaleString()}</td>
                <td class="p-3 text-blue-800 flex items-center justify-center gap-2 relative text-center">
                    ${Math.round(data.total).toLocaleString()}
                    <svg id="icon-year-${year}" class="w-3 h-3 transition-transform duration-300 absolute right-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </td>
            </tr>`;

        data.months.forEach((m) => {
            const monthInYear = (m.period % 12 === 0) ? 12 : (m.period % 12);
            html += `
                <tr class="details-year-${year} hidden bg-white hover:bg-gray-50 transition border-b">
                    <td class="p-2 text-gray-300 border-r bg-gray-50/20 text-center"></td>
                    <td class="p-2 font-medium border-r text-center">${monthInYear}</td>
                    <td class="p-2 text-gray-500 border-r text-center">${Math.round(m.balance).toLocaleString()}</td>
                    <td class="p-2 text-gray-600 border-r text-center">${Math.round(m.principal).toLocaleString()}</td>
                    <td class="p-2 text-red-400 border-r text-center">${Math.round(m.interest).toLocaleString()}</td>
                    <td class="p-2 font-bold text-gray-700 text-center">${Math.round(m.total).toLocaleString()}</td>
                </tr>`;
        });
    });

    const totalInt = schedule.reduce((s, r) => s + r.interest, 0);
    html += `
                <tr class="bg-gray-800 text-white font-bold text-sm">
                    <td class="p-3 border-r border-gray-700 text-center" colspan="2 uppercase">GRAND TOTAL</td>
                    <td class="p-3 border-r border-gray-700 text-gray-400 text-center">-</td>
                    <td class="p-3 border-r border-gray-700 text-center">${Math.round(amount).toLocaleString()}</td>
                    <td class="p-3 border-r border-gray-700 text-yellow-400 text-center">${Math.round(totalInt).toLocaleString()}</td>
                    <td class="p-3 text-green-400 text-center">${Math.round(amount + totalInt).toLocaleString()}</td>
                </tr>
            </tbody></table></div>`;
    
    document.getElementById('tableContainer').innerHTML = html;
}

function toggleYear(year) {
    const rows = document.querySelectorAll(`.details-year-${year}`);
    const icon = document.getElementById(`icon-year-${year}`);
    rows.forEach(row => row.classList.toggle('hidden'));
    if(icon) icon.classList.toggle('rotate-180');
}

function formatNumberInput(e) {
    const el = e.target;
    let val = el.value.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    el.value = parts.join('.');
}

function saveHistory(data, schedule) {
    let history = JSON.parse(localStorage.getItem('loan_history')) || [];
    history.unshift({ ...data, schedule, id: Date.now() });
    localStorage.setItem('loan_history', JSON.stringify(history.slice(0, 10)));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('loan_history')) || [];
    const container = document.getElementById('historyTable');
    container.innerHTML = '';
    if (history.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-300 italic">No history found</td></tr>';
        return;
    }
    history.forEach((item, index) => {
        container.innerHTML += `
            <tr class="hover:bg-blue-50 border-b cursor-pointer transition text-center" onclick="viewOldCalculation(${index})">
                <td class="p-4 font-bold text-center">$${item.amount.toLocaleString()}</td>
                <td class="p-4 text-center">${item.rateYear}%</td>
                <td class="p-4 text-center">${item.years}Y</td>
                <td class="p-4 text-center text-red-500 font-bold">$${Math.round(item.totalInterest).toLocaleString()}</td>
                <td class="p-4 text-center font-black text-blue-600">$${Math.round(item.totalPayable).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <button onclick="event.stopPropagation(); openDeleteModal(${index})" class="text-gray-300 hover:text-red-500 font-bold">✕</button>
                </td>
            </tr>`;
    });
}

function viewOldCalculation(index) {
    const history = JSON.parse(localStorage.getItem('loan_history')) || [];
    const item = history[index];
    document.getElementById('totalInterestRes').innerText = `$${Math.round(item.totalInterest).toLocaleString()}`;
    document.getElementById('totalPayableRes').innerText = `$${Math.round(item.totalPayable).toLocaleString()}`;
    document.getElementById('resultSummary').classList.remove('hidden');
    renderDetailedTable(item.schedule, item.amount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDeleteModal(index) {
    deleteTarget = index;
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmBtn').onclick = executeDelete;
}

function openClearAllModal() {
    deleteTarget = 'all';
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmBtn').onclick = executeDelete;
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

function executeDelete() {
    let history = JSON.parse(localStorage.getItem('loan_history')) || [];
    if (deleteTarget === 'all') {
        localStorage.removeItem('loan_history');
        document.getElementById('tableContainer').innerHTML = '';
        document.getElementById('resultSummary').classList.add('hidden');
    } else {
        history.splice(deleteTarget, 1);
        localStorage.setItem('loan_history', JSON.stringify(history));
    }
    loadHistory();
    closeModal();
}