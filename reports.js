// ==============================
// Reports Page
// ==============================

let reportIncomeExpenseChart = null;
let reportExpenseCategoryChart = null;
let reportMonthlyChart = null;

document.addEventListener("DOMContentLoaded", () => {

    renderReports();

});

document.addEventListener("languageChanged", () => {

    renderReports();

});

function renderReports() {

    const transactions = AppStorage.getTransactions();


    // ==============================
    // Calculate Totals
    // ==============================

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {

        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {

            totalIncome += amount;

        } else {

            totalExpense += amount;

        }

    });

    const balance = totalIncome - totalExpense;


    // ==============================
    // Update Cards
    // ==============================

    const incomeEl = document.getElementById("report-income");
    const expenseEl = document.getElementById("report-expense");
    const balanceEl = document.getElementById("report-balance");

    if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome);
    if (expenseEl) expenseEl.textContent = formatCurrency(totalExpense);
    if (balanceEl) balanceEl.textContent = formatCurrency(balance);


    drawReportIncomeExpenseChart(totalIncome, totalExpense);

    drawReportExpenseCategoryChart(transactions);

    drawReportMonthlyChart(transactions);

}


// ==============================
// Income / Expense Chart
// ==============================

function drawReportIncomeExpenseChart(totalIncome, totalExpense) {

    const canvas = document.getElementById("incomeExpenseChart");

    if (!canvas) return;

    reportIncomeExpenseChart = safeDrawChart("incomeExpenseChart", () => {

        if (reportIncomeExpenseChart) {
            reportIncomeExpenseChart.destroy();
        }

        return new Chart(canvas, {

            type: "bar",

            data: {

                labels: [t("income"), t("expense")],

                datasets: [{

                    label: t("amount"),

                    data: [totalIncome, totalExpense],

                    backgroundColor: ["#4CAF50", "#F44336"],

                    borderRadius: 8

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        });

    });

}


// ==============================
// Expense by Category Chart
// (مبني على المعاملات والتصنيفات الحقيقية
//  عبر categoryId، بدل أرقام ثابتة وهمية)
// ==============================

function drawReportExpenseCategoryChart(transactions) {

    const canvas = document.getElementById("expenseChart");

    if (!canvas) return;

    const categoryTotals = {};

    transactions.forEach(transaction => {

        if (transaction.type !== "expense") return;

        const key = transaction.categoryId ?? "none";

        if (!categoryTotals[key]) {
            categoryTotals[key] = 0;
        }

        categoryTotals[key] += Number(transaction.amount) || 0;

    });

    const keys = Object.keys(categoryTotals);

    const labels = keys.map(key =>
        key === "none"
            ? t("uncategorized")
            : resolveCategoryName(Number(key))
    );

    const data = Object.values(categoryTotals);

    reportExpenseCategoryChart = safeDrawChart("expenseChart", () => {

        if (reportExpenseCategoryChart) {
            reportExpenseCategoryChart.destroy();
        }

        return new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels.length ? labels : [t("no-results")],

                datasets: [{

                    data: data.length ? data : [1],

                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF",
                        "#FF9F40",
                        "#8BC34A",
                        "#E91E63"
                    ]

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });

    });

}


// ==============================
// Monthly Chart
// ==============================

function drawReportMonthlyChart(transactions) {

    const canvas = document.getElementById("monthlyChart");

    if (!canvas) return;

    const months = [
        "يناير", "فبراير", "مارس", "أبريل",
        "مايو", "يونيو", "يوليو", "أغسطس",
        "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const currentYear = new Date().getFullYear();

    const monthlyExpense = new Array(12).fill(0);

    transactions.forEach(transaction => {

        if (transaction.type !== "expense") return;

        const date = new Date(transaction.date);

        if (isNaN(date) || date.getFullYear() !== currentYear) return;

        monthlyExpense[date.getMonth()] += Number(transaction.amount) || 0;

    });

    reportMonthlyChart = safeDrawChart("monthlyChart", () => {

        if (reportMonthlyChart) {
            reportMonthlyChart.destroy();
        }

        return new Chart(canvas, {

            type: "line",

            data: {

                labels: months,

                datasets: [{

                    label: t("expense"),

                    data: monthlyExpense,

                    borderColor: "#F44336",

                    backgroundColor: "rgba(244,67,54,0.2)",

                    fill: true,

                    tension: 0.4

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });

    });

}
