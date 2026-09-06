
// ==============================
// Dashboard
// ==============================

let incomeExpenseChart = null;
let categoryChart = null;
let monthlyChart = null;

document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
});

document.addEventListener("languageChanged", () => {
    updateDashboard();
});

// ==============================
// Update Dashboard
// ==============================

function updateDashboard() {

    const transactions = AppStorage.getTransactions();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(item => {

        const amount = Number(item.amount) || 0;

        if (item.type === "income") {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }

    });

    const balance = totalIncome - totalExpense;

    // البطاقات
    document.getElementById("total-income").textContent =
        formatCurrency(totalIncome);

    document.getElementById("total-expense").textContent =
        formatCurrency(totalExpense);

    document.getElementById("total-balance").textContent =
        formatCurrency(balance);

    document.getElementById("net-balance").textContent =
        formatCurrency(balance);

    const totalTransactions =
        document.getElementById("total-transactions");

    if (totalTransactions) {
        totalTransactions.textContent = transactions.length;
    }

    const totalCategories =
        document.getElementById("total-categories");

    if (totalCategories) {

        // إجمالي التصنيفات المُنشأة فعليًا
        // (وليس فقط التصنيفات المستخدمة في المعاملات)
        totalCategories.textContent =
            AppStorage.getCategories().length;

    }

    displayRecentTransactions(transactions);

    updateCharts(transactions);

}

// ==============================
// Recent Transactions
// (escapeHTML لمنع أي حقن HTML من نصوص
//  المستخدم مثل عنوان المعاملة)
// ==============================

function displayRecentTransactions(transactions) {

    const tbody =
        document.getElementById("recent-transactions");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (transactions.length === 0) {

        tbody.innerHTML = `
        <tr>
            <td colspan="4">
                ${t("no-transactions")}
            </td>
        </tr>
        `;

        return;
    }

    transactions
        .slice(-5)
        .reverse()
        .forEach(item => {

            tbody.innerHTML += `
            <tr>
                <td>${escapeHTML(item.date)}</td>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(resolveCategoryLabel(item.categoryId))}</td>
                <td>${formatCurrency(item.amount)}</td>
            </tr>
            `;

        });

}

// ==============================
// Charts
// ==============================

function updateCharts(transactions) {

    drawIncomeExpenseChart(transactions);

    drawCategoryChart(transactions);

    drawMonthlyChart(transactions);

}

// ==============================
// Income Expense Chart
// ==============================

function drawIncomeExpenseChart(transactions) {

    const canvas =
        document.getElementById("incomeExpenseChart");

    if (!canvas) return;

    let income = 0;
    let expense = 0;

    transactions.forEach(item => {

        if (item.type === "income") {
            income += Number(item.amount) || 0;
        } else {
            expense += Number(item.amount) || 0;
        }

    });

    incomeExpenseChart = safeDrawChart("incomeExpenseChart", () => {

        if (incomeExpenseChart) {
            incomeExpenseChart.destroy();
        }

        return new Chart(canvas, {

            type: "bar",

            data: {

                labels: [
                    t("income"),
                    t("expense")
                ],

                datasets: [{

                    label: t("amount"),

                    data: [
                        income,
                        expense
                    ],

                    backgroundColor: [
                        "#4CAF50",
                        "#F44336"
                    ],

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
// Category Chart
// (التجميع حسب categoryId ثم تحويله لاسم
//  التصنيف الحالي عبر resolveCategoryName)
// ==============================

function drawCategoryChart(transactions) {

    const canvas = document.getElementById("categoryChart");

    if (!canvas) return;

    const categoryTotals = {};

    transactions.forEach(item => {

        if (item.type === "expense") {

            const key = item.categoryId ?? "none";

            if (!categoryTotals[key]) {
                categoryTotals[key] = 0;
            }

            categoryTotals[key] += Number(item.amount) || 0;

        }

    });

    const labels = Object.keys(categoryTotals).map(key =>
        key === "none"
            ? t("uncategorized")
            : resolveCategoryName(Number(key))
    );

    const data = Object.values(categoryTotals);

    categoryChart = safeDrawChart("categoryChart", () => {

        if (categoryChart) {
            categoryChart.destroy();
        }

        return new Chart(canvas, {

            type: "pie",

            data: {

                labels: labels,

                datasets: [{

                    data: data,

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
// نعرض شهور السنة الحالية فقط حتى لا
// تختلط بيانات سنوات مختلفة في نفس الشهر
// ==============================

function drawMonthlyChart(transactions) {

    const canvas = document.getElementById("monthlyChart");

    if (!canvas) return;

    const months = [
        "يناير", "فبراير", "مارس", "أبريل",
        "مايو", "يونيو", "يوليو", "أغسطس",
        "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const currentYear = new Date().getFullYear();

    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpense = new Array(12).fill(0);

    transactions.forEach(item => {

        const date = new Date(item.date);

        if (isNaN(date)) return;

        if (date.getFullYear() !== currentYear) return;

        const month = date.getMonth();
        const amount = Number(item.amount) || 0;

        if (item.type === "income") {
            monthlyIncome[month] += amount;
        } else {
            monthlyExpense[month] += amount;
        }

    });

    const monthlyTitle =
        document.getElementById("monthly-chart-title");

    if (monthlyTitle) {

        const baseText = t("monthly-chart");

        monthlyTitle.textContent = `${baseText} (${currentYear})`;

    }

    monthlyChart = safeDrawChart("monthlyChart", () => {

        if (monthlyChart) {
            monthlyChart.destroy();
        }

        return new Chart(canvas, {

            type: "line",

            data: {

                labels: months,

                datasets: [

                    {
                        label: t("income"),
                        data: monthlyIncome,
                        borderColor: "#4CAF50",
                        backgroundColor: "rgba(76,175,80,0.2)",
                        fill: true,
                        tension: 0.4
                    },

                    {
                        label: t("expense"),
                        data: monthlyExpense,
                        borderColor: "#F44336",
                        backgroundColor: "rgba(244,67,54,0.2)",
                        fill: true,
                        tension: 0.4
                    }

                ]

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
