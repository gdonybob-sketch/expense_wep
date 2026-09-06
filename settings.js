// ======================================
// Settings Page
// ======================================


// ======================================
// DOM Elements
// ======================================

const settingsLanguage =
    document.getElementById("settings-language");

const clearDataButton =
    document.getElementById("clear-data-btn");

const settingsThemeButton =
    document.getElementById("settings-theme-btn");

const exportDataButton =
    document.getElementById("export-data-btn");

const importDataInput =
    document.getElementById("import-data-input");


// ======================================
// Page Load
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadSettingsLanguage();

    updateSettingsThemeButton();

});


// ======================================
// Language
// ======================================

function loadSettingsLanguage() {

    if (!settingsLanguage) return;

    const currentLanguage =
        AppStorage.getLanguage();

    settingsLanguage.value = currentLanguage;

}


// ======================================
// Change Language
// ======================================

if (settingsLanguage) {

    settingsLanguage.addEventListener("change", () => {

        const language =
            settingsLanguage.value;

        if (typeof applyLanguage === "function") {

            applyLanguage(language);

        }

    });

}


// ======================================
// Theme Button
// ======================================

if (settingsThemeButton) {

    settingsThemeButton.addEventListener("click", () => {

        const themeButton =
            document.getElementById("theme-btn");

        if (themeButton) {

            themeButton.click();

        }

        updateSettingsThemeButton();

    });

}


// ======================================
// Update Theme Button
// ======================================

function updateSettingsThemeButton() {

    if (!settingsThemeButton) return;

    const isDark =
        document.body.classList.contains("dark");

    if (isDark) {

        settingsThemeButton.textContent = "☀️";

    } else {

        settingsThemeButton.textContent = "🌙";

    }

}


// ======================================
// Clear All Data
// ======================================

if (clearDataButton) {

    clearDataButton.addEventListener("click", async () => {

        const confirmed = await showConfirm(
            t("clear-data-confirm")
        );

        if (!confirmed) return;


        // Delete application data

        AppStorage.clearAppData();


        showToast(t("clear-data-success"), "success");


        setTimeout(() => location.reload(), 800);

    });

}


// ======================================
// Export Data (JSON backup)
// ======================================

if (exportDataButton) {

    exportDataButton.addEventListener("click", () => {

        const payload = {

            exportedAt: new Date().toISOString(),

            version: 1,

            transactions: AppStorage.getTransactions(),

            categories: AppStorage.getCategories(),

            budget: AppStorage.getBudget(),

            categoryBudgets: AppStorage.getCategoryBudgets()

        };

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const today = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = `expense-manager-backup-${today}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showToast(t("export-success"), "success");

    });

}


// ======================================
// Import Data (JSON backup)
// ======================================

if (importDataInput) {

    importDataInput.addEventListener("change", async () => {

        const file = importDataInput.files[0];

        importDataInput.value = "";

        if (!file) return;

        try {

            const text = await file.text();

            const data = JSON.parse(text);

            const looksValid =
                data &&
                Array.isArray(data.transactions) &&
                Array.isArray(data.categories);

            if (!looksValid) {

                throw new Error("invalid-format");

            }

            const confirmed = await showConfirm(
                t("import-confirm")
            );

            if (!confirmed) return;

            AppStorage.saveTransactions(data.transactions);
            AppStorage.saveCategories(data.categories);

            if (typeof data.budget === "number") {

                AppStorage.saveBudget(data.budget);

            }

            if (data.categoryBudgets && typeof data.categoryBudgets === "object") {

                AppStorage.saveCategoryBudgets(data.categoryBudgets);

            }

            showToast(t("import-success"), "success");

            setTimeout(() => location.reload(), 800);

        } catch (err) {

            showToast(t("import-error"), "error");

        }

    });

}
