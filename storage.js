// ======================================
// Centralized LocalStorage Wrapper
// ======================================
// كل قراءة/كتابة لبيانات التطبيق تمر من هنا
// بدل تكرار JSON.parse/JSON.stringify في كل ملف.
// هذه الطبقة أيضًا تجعل الانتقال المستقبلي
// لمخزن آخر (IndexedDB مثلاً) أسهل، لأن باقي
// الكود لا يتعامل مع localStorage مباشرة أبدًا.

const AppStorage = {

    KEYS: {
        TRANSACTIONS: "transactions",
        CATEGORIES: "categories",
        BUDGETS: "budgets",                 // { "2026-09": 3000, ... }
        CATEGORY_BUDGETS: "categoryBudgets", // { "طعام": 500, ... }
        LEGACY_BUDGET: "budget",             // نسخة قديمة: رقم واحد فقط
        THEME: "theme",
        LANGUAGE: "language",
        SESSION: "isLoggedIn"
    },


    // ==================================
    // Transactions
    // ==================================

    getTransactions() {
        try {
            const transactions = JSON.parse(
                localStorage.getItem(this.KEYS.TRANSACTIONS)
            ) || [];

            if (this._migrateTransactionCategories(transactions)) {
                this.saveTransactions(transactions);
            }

            return transactions;
        } catch (e) {
            return [];
        }
    },

    saveTransactions(transactions) {
        localStorage.setItem(
            this.KEYS.TRANSACTIONS,
            JSON.stringify(transactions)
        );
    },

    // ترحيل تلقائي لمرة واحدة: من ربط المعاملة
    // بالتصنيف عبر اسمه النصي (category) إلى
    // الربط بمعرّف ثابت (categoryId) لا يتأثر
    // بإعادة تسمية التصنيف لاحقًا.
    _migrateTransactionCategories(transactions) {

        let changed = false;

        let categories = null;

        transactions.forEach(transaction => {

            if (transaction.categoryId !== undefined) return;

            changed = true;

            if (!categories) {
                categories = this.getCategories();
            }

            const match = transaction.category
                ? categories.find(c => c.name === transaction.category)
                : null;

            transaction.categoryId = match ? match.id : null;

            delete transaction.category;

        });

        return changed;

    },


    // ==================================
    // Categories
    // ==================================

    getCategories() {
        try {
            return JSON.parse(
                localStorage.getItem(this.KEYS.CATEGORIES)
            ) || [];
        } catch (e) {
            return [];
        }
    },

    saveCategories(categories) {
        localStorage.setItem(
            this.KEYS.CATEGORIES,
            JSON.stringify(categories)
        );
    },

    getCategoryById(id) {
        return this.getCategories().find(
            category => category.id === id
        ) || null;
    },


    // ==================================
    // Monthly Budgets
    // "YYYY-MM" -> amount
    // ==================================

    getBudgets() {

        try {

            const budgets = JSON.parse(
                localStorage.getItem(this.KEYS.BUDGETS)
            ) || {};

            // ترحيل تلقائي من صيغة الميزانية القديمة
            // (رقم واحد ثابت) إلى شهر اليوم، مرة واحدة فقط
            const legacy = localStorage.getItem(this.KEYS.LEGACY_BUDGET);

            if (legacy !== null && Object.keys(budgets).length === 0) {

                const currentMonth = this.getCurrentMonthKey();

                budgets[currentMonth] = Number(legacy) || 0;

                localStorage.setItem(
                    this.KEYS.BUDGETS,
                    JSON.stringify(budgets)
                );

                localStorage.removeItem(this.KEYS.LEGACY_BUDGET);

            }

            return budgets;

        } catch (e) {

            return {};

        }

    },

    getCurrentMonthKey() {

        const now = new Date();

        const month = String(now.getMonth() + 1).padStart(2, "0");

        return `${now.getFullYear()}-${month}`;

    },

    getBudgetForMonth(monthKey) {

        const budgets = this.getBudgets();

        return Number(budgets[monthKey]) || 0;

    },

    saveBudgetForMonth(monthKey, amount) {

        const budgets = this.getBudgets();

        budgets[monthKey] = Number(amount) || 0;

        localStorage.setItem(
            this.KEYS.BUDGETS,
            JSON.stringify(budgets)
        );

    },


    // ==================================
    // Per-Category Budgets
    // categoryId -> monthly amount
    // ==================================

    getCategoryBudgets() {

        try {

            return JSON.parse(
                localStorage.getItem(this.KEYS.CATEGORY_BUDGETS)
            ) || {};

        } catch (e) {

            return {};

        }

    },

    saveCategoryBudgets(map) {

        localStorage.setItem(
            this.KEYS.CATEGORY_BUDGETS,
            JSON.stringify(map)
        );

    },

    saveCategoryBudget(categoryId, amount) {

        const map = this.getCategoryBudgets();

        if (!amount || Number(amount) <= 0) {

            delete map[categoryId];

        } else {

            map[categoryId] = Number(amount);

        }

        this.saveCategoryBudgets(map);

    },


    // ==================================
    // Theme
    // ==================================

    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || "light";
    },

    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },


    // ==================================
    // Language
    // ==================================

    getLanguage() {
        return localStorage.getItem(this.KEYS.LANGUAGE) || "ar";
    },

    saveLanguage(language) {
        localStorage.setItem(this.KEYS.LANGUAGE, language);
    },


    // ==================================
    // Session (تسجيل دخول من جهة العميل فقط)
    // ==================================
    // ⚠️ هذا ليس نظام مصادقة حقيقي: لا يوجد
    // خادم أو قاعدة بيانات مستخدمين. أي شخص
    // يفتح أدوات المطوّر يستطيع تجاوزه بسهولة.
    // الغرض منه فقط شاشة دخول بسيطة تناسب
    // تطبيقًا يعمل بالكامل محليًا في المتصفح.
    // ==================================

    isLoggedIn() {
        return localStorage.getItem(this.KEYS.SESSION) === "1";
    },

    setLoggedIn(value) {

        if (value) {
            localStorage.setItem(this.KEYS.SESSION, "1");
        } else {
            localStorage.removeItem(this.KEYS.SESSION);
        }

    },


    // ==================================
    // Clear All App Data
    // ==================================

    clearAppData() {
        localStorage.removeItem(this.KEYS.TRANSACTIONS);
        localStorage.removeItem(this.KEYS.CATEGORIES);
        localStorage.removeItem(this.KEYS.BUDGETS);
        localStorage.removeItem(this.KEYS.CATEGORY_BUDGETS);
        localStorage.removeItem(this.KEYS.LEGACY_BUDGET);
    }

};
