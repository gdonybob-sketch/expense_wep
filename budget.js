// ======================================
// Budget System (شهري + لكل تصنيف)
// ======================================


// ======================================
// Elements
// ======================================

const budgetForm =
    document.getElementById("budget-form");

const budgetMonthInput =
    document.getElementById("budget-month");

const budgetInput =
    document.getElementById("budget-amount");

const totalBudget =
    document.getElementById("total-budget");

const spentBudget =
    document.getElementById("spent-budget");

const remainingBudget =
    document.getElementById("remaining-budget");

const progressFill =
    document.getElementById("progress-fill");

const progressText =
    document.getElementById("progress-text");

const categoryBudgetsList =
    document.getElementById("category-budgets-list");


// ======================================
// Page Load
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (budgetMonthInput) {

            budgetMonthInput.value =
                AppStorage.getCurrentMonthKey();

        }

        loadBudget(false);

        renderCategoryBudgets();

    }
);

document.addEventListener("languageChanged", () => {

    loadBudget(false);

    renderCategoryBudgets();

});


// ======================================
// Month Switch (بدون حفظ، فقط عرض)
// ======================================

if (budgetMonthInput) {

    budgetMonthInput.addEventListener("change", () => {

        loadBudget(false);

        renderCategoryBudgets();

    });

}


// ======================================
// Save Overall Monthly Budget
// ======================================

if (budgetForm) {

    budgetForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();


            const budget =
                Number(budgetInput.value);


            if (budget < 0 || isNaN(budget)) {

                showToast(
                    t("budget-invalid"),
                    "error"
                );

                return;

            }


            const monthKey =
                budgetMonthInput?.value ||
                AppStorage.getCurrentMonthKey();


            AppStorage.saveBudgetForMonth(monthKey, budget);


            loadBudget(true);


            showToast(
                t("budget-saved"),
                "success"
            );

        }
    );

}


// ======================================
// Get Transactions for a Given Month
// ======================================

function getMonthTransactions(monthKey) {

    return AppStorage.getTransactions().filter(item => {

        const date = new Date(item.date);

        if (isNaN(date)) return false;

        const key =
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        return key === monthKey;

    });

}


// ======================================
// Load Overall Budget for Selected Month
// ======================================

function loadBudget(notifyIfExceeded) {

    const monthKey =
        budgetMonthInput?.value ||
        AppStorage.getCurrentMonthKey();

    const budget = AppStorage.getBudgetForMonth(monthKey);

    const monthTransactions = getMonthTransactions(monthKey);


    let expense = 0;


    monthTransactions.forEach(
        item => {

            if (item.type === "expense") {

                expense += Number(item.amount) || 0;

            }

        }
    );


    const remaining =
        budget - expense;


    if (budgetInput) {

        budgetInput.value = budget || "";

    }


    if (totalBudget) {

        totalBudget.textContent =
            formatCurrency(budget);

    }


    if (spentBudget) {

        spentBudget.textContent =
            formatCurrency(expense);

    }


    if (remainingBudget) {

        remainingBudget.textContent =
            formatCurrency(remaining);

    }


    updateProgress(
        budget,
        expense,
        notifyIfExceeded
    );

}


// ======================================
// Overall Progress Bar
// ======================================

function updateProgress(
    budget,
    expense,
    notifyIfExceeded
) {

    if (!progressFill || !progressText) {
        return;
    }


    if (budget <= 0) {

        progressFill.style.width =
            "0%";

        progressText.textContent =
            "0%";

        return;

    }


    let percent =
        (expense / budget) * 100;


    if (percent > 100) {

        percent = 100;

    }


    if (percent < 0) {

        percent = 0;

    }


    progressFill.style.width =
        percent + "%";


    progressText.textContent =
        percent.toFixed(0) + "%";


    if (notifyIfExceeded && expense > budget) {

        showToast(
            t("budget-exceeded"),
            "error"
        );

    }

}


// ======================================
// Per-Category Budgets
// (تعرض فقط تصنيفات المصروفات، لأن
//  ميزانية الدخل غير منطقية)
// ======================================

function renderCategoryBudgets() {

    if (!categoryBudgetsList) return;

    const monthKey =
        budgetMonthInput?.value ||
        AppStorage.getCurrentMonthKey();

    const categories =
        AppStorage.getCategories()
            .filter(category => category.type === "expense");

    const categoryBudgets =
        AppStorage.getCategoryBudgets();

    const monthTransactions =
        getMonthTransactions(monthKey);

    categoryBudgetsList.innerHTML = "";

    if (categories.length === 0) {

        categoryBudgetsList.innerHTML = `
            <p class="category-budget-empty">
                ${t("no-categories")}
            </p>
        `;

        return;

    }

    categories.forEach(category => {

        const spent = monthTransactions
            .filter(item =>
                item.type === "expense" &&
                item.categoryId === category.id
            )
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        const limit = Number(categoryBudgets[category.id]) || 0;

        let percent = limit > 0 ? (spent / limit) * 100 : 0;

        if (percent > 100) percent = 100;

        const overBudget = limit > 0 && spent > limit;

        const row = document.createElement("div");
        row.className = "category-budget-row";

        const nameEl = document.createElement("div");
        nameEl.className = "category-budget-name";
        nameEl.textContent = `${category.icon} ${category.name}`;

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.step = "0.01";
        input.value = limit || "";
        input.placeholder = t("category-budget");

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.textContent = t("save-budget");

        saveBtn.addEventListener("click", () => {

            AppStorage.saveCategoryBudget(
                category.id,
                Number(input.value) || 0
            );

            showToast(t("category-budget-saved"), "success");

            renderCategoryBudgets();

        });

        const progressWrap = document.createElement("div");
        progressWrap.className = "category-budget-progress";

        const spentLabel = document.createElement("span");
        spentLabel.textContent =
            limit > 0
                ? `${formatCurrency(spent)} / ${formatCurrency(limit)}`
                : formatCurrency(spent);

        const bar = document.createElement("div");
        bar.className = "category-budget-bar";

        const fill = document.createElement("div");
        fill.className =
            "category-budget-fill" + (overBudget ? " over-budget" : "");
        fill.style.width = percent + "%";

        bar.appendChild(fill);
        progressWrap.appendChild(spentLabel);
        progressWrap.appendChild(bar);

        row.appendChild(nameEl);
        row.appendChild(input);
        row.appendChild(saveBtn);
        row.appendChild(progressWrap);

        categoryBudgetsList.appendChild(row);

    });

}
