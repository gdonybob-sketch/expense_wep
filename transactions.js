// ======================================
// Load Categories (into <select id="category">
// and <select id="filter-category">)
// ======================================

function loadCategories() {

    const categorySelect = document.getElementById("category");
    const filterCategorySelect = document.getElementById("filter-category");

    const categories = AppStorage.getCategories();

    if (categorySelect) {

        categorySelect.innerHTML = "";

        if (categories.length === 0) {

            categorySelect.innerHTML =
                `<option value="">${t("no-categories")}</option>`;

        } else {

            categories.forEach(category => {

                const option = document.createElement("option");

                option.value = category.id;

                option.textContent = `${category.icon} ${category.name}`;

                categorySelect.appendChild(option);

            });

        }

    }

    if (filterCategorySelect) {

        const currentValue = filterCategorySelect.value;

        filterCategorySelect.innerHTML =
            `<option value="" data-lang="filter-all-categories">${t("filter-all-categories")}</option>`;

        categories.forEach(category => {

            const option = document.createElement("option");

            option.value = category.id;

            option.textContent = `${category.icon} ${category.name}`;

            filterCategorySelect.appendChild(option);

        });

        filterCategorySelect.value = currentValue;

    }

}

// ======================================
// Global Variables
// ======================================

let editingTransactionId = null;

const transactionForm =
    document.getElementById("transaction-form");

const transactionsBody =
    document.getElementById("transactions-body");

const saveButton =
    document.querySelector(".save-btn");

const searchInput =
    document.getElementById("search-input");

const filterTypeSelect =
    document.getElementById("filter-type");

const filterCategorySelect =
    document.getElementById("filter-category");

const sortSelect =
    document.getElementById("sort-transactions");

// ======================================
// Page Load
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadCategories();

    displayTransactions();

    const dateInput =
        document.getElementById("date");

    if (dateInput) {

        dateInput.valueAsDate = new Date();

    }

});

document.addEventListener("languageChanged", () => {

    loadCategories();

    displayTransactions();

});

// ======================================
// Search / Filter / Sort
// ======================================

[searchInput, filterTypeSelect, filterCategorySelect, sortSelect]
    .forEach(control => {

        if (!control) return;

        const event = control.tagName === "SELECT" ? "change" : "input";

        control.addEventListener(event, displayTransactions);

    });

function getFilteredSortedTransactions() {

    let transactions = getTransactions();

    const searchTerm =
        (searchInput?.value || "").trim().toLowerCase();

    const typeFilter = filterTypeSelect?.value || "";

    const categoryFilter = filterCategorySelect?.value || "";

    if (searchTerm) {

        transactions = transactions.filter(item =>
            item.title.toLowerCase().includes(searchTerm)
        );

    }

    if (typeFilter) {

        transactions = transactions.filter(
            item => item.type === typeFilter
        );

    }

    if (categoryFilter) {

        transactions = transactions.filter(
            item => String(item.categoryId) === String(categoryFilter)
        );

    }

    const sortBy = sortSelect?.value || "date-desc";

    transactions = transactions.slice().sort((a, b) => {

        switch (sortBy) {

            case "date-asc":
                return new Date(a.date) - new Date(b.date);

            case "amount-desc":
                return Number(b.amount) - Number(a.amount);

            case "amount-asc":
                return Number(a.amount) - Number(b.amount);

            case "date-desc":
            default:
                return new Date(b.date) - new Date(a.date);

        }

    });

    return transactions;

}

// ======================================
// Get / Save Transactions
// ======================================

function getTransactions() {

    return AppStorage.getTransactions();

}

function saveTransactions(transactions) {

    AppStorage.saveTransactions(transactions);

}

// ======================================
// Display Transactions
// (النصوص القادمة من المستخدم تُعرض عبر
//  escapeHTML لمنع أي حقن HTML/سكربت)
// ======================================

function displayTransactions() {

    if (!transactionsBody) return;

    const transactions = getFilteredSortedTransactions();

    transactionsBody.innerHTML = "";

    if (transactions.length === 0) {

        const allTransactions = getTransactions();

        transactionsBody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${allTransactions.length === 0 ? t("no-transactions") : t("no-results")}
                </td>
            </tr>
        `;

        return;

    }

    transactions.forEach(transaction => {

        const categoryLabel =
            resolveCategoryLabel(transaction.categoryId);

        const recurringBadge =
            transaction.recurring ? " 🔁" : "";

        transactionsBody.innerHTML += `
            <tr>

                <td>${escapeHTML(transaction.title)}</td>

                <td>${formatCurrency(transaction.amount)}</td>

                <td>
                    ${transaction.type === "income"
                        ? escapeHTML(t("income"))
                        : escapeHTML(t("expense"))}
                </td>

                <td>${escapeHTML(categoryLabel)}</td>

                <td>${escapeHTML(transaction.date)}${recurringBadge}</td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editTransaction(${transaction.id})"
                        title="${t("edit")}"
                        aria-label="${t("edit")}"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})"
                        title="${t("delete")}"
                        aria-label="${t("delete")}"
                    >
                        🗑️
                    </button>

                </td>

            </tr>
        `;

    });

}

// ======================================
// Validate Transaction Form
// ======================================

function validateTransactionForm() {

    const title =
        document.getElementById("title").value.trim();

    const amount =
        Number(document.getElementById("amount").value);

    const date =
        document.getElementById("date").value;

    const categoryId =
        document.getElementById("category").value;

    if (!title) {

        showToast(t("fill-transaction-title"), "error");

        return false;

    }

    if (!amount || amount <= 0 || isNaN(amount)) {

        showToast(t("fill-transaction-amount"), "error");

        return false;

    }

    if (!date) {

        showToast(t("fill-transaction-date"), "error");

        return false;

    }

    if (!categoryId) {

        showToast(t("fill-transaction-category"), "error");

        return false;

    }

    return true;

}

// ======================================
// Read Form Values
// ======================================

function readTransactionForm() {

    return {

        title:
            document.getElementById("title").value.trim(),

        amount:
            Number(document.getElementById("amount").value),

        type:
            document.getElementById("type").value,

        categoryId:
            Number(document.getElementById("category").value),

        date:
            document.getElementById("date").value,

        recurring:
            document.getElementById("recurring")?.value || null

    };

}

// ======================================
// Add Transaction
// ======================================

function addTransaction() {

    if (!validateTransactionForm()) return;

    const transactions = getTransactions();

    transactions.push({

        id: Date.now(),

        ...readTransactionForm()

    });

    saveTransactions(transactions);

    resetForm();

    displayTransactions();

    showToast(t("transaction-saved"), "success");

}

// ======================================
// Edit Transaction
// ======================================

function editTransaction(id) {

    const transaction = getTransactions().find(
        item => item.id === id
    );

    if (!transaction) return;

    document.getElementById("title").value =
        transaction.title;

    document.getElementById("amount").value =
        transaction.amount;

    document.getElementById("type").value =
        transaction.type;

    document.getElementById("category").value =
        transaction.categoryId ?? "";

    document.getElementById("date").value =
        transaction.date;

    const recurringInput =
        document.getElementById("recurring");

    if (recurringInput) {

        recurringInput.value = transaction.recurring || "";

    }

    editingTransactionId = id;

    saveButton.textContent =
        t("update-transaction");

    transactionForm.scrollIntoView({

        behavior: "smooth"

    });

}

// ======================================
// Update Transaction
// ======================================

function updateTransaction() {

    if (!validateTransactionForm()) return;

    let transactions = getTransactions();

    const index = transactions.findIndex(
        item => item.id === editingTransactionId
    );

    if (index === -1) return;

    transactions[index] = {

        ...transactions[index],

        ...readTransactionForm()

    };

    saveTransactions(transactions);

    resetForm();

    displayTransactions();

    showToast(t("transaction-updated"), "success");

}

// ======================================
// Delete Transaction
// ======================================

async function deleteTransaction(id) {

    const confirmed = await showConfirm(
        t("confirm-delete")
    );

    if (!confirmed) return;

    let transactions = getTransactions();

    transactions = transactions.filter(
        item => item.id !== id
    );

    saveTransactions(transactions);

    displayTransactions();

}

// ======================================
// Reset Form
// ======================================

function resetForm() {

    transactionForm.reset();

    editingTransactionId = null;

    saveButton.textContent =
        t("save-transaction");

    const dateInput =
        document.getElementById("date");

    if (dateInput) {

        dateInput.valueAsDate = new Date();

    }

}

// ======================================
// Form Submit
// ======================================

if (transactionForm) {

    transactionForm.addEventListener("submit", function (e) {

        e.preventDefault();

        if (editingTransactionId === null) {

            addTransaction();

        } else {

            updateTransaction();

        }

    });

}
