// ==============================
// Sidebar Menu
// ==============================

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (menuBtn && sidebar && overlay) {

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });

}

// ==============================
// Add Transaction Button
// ==============================

const addBtn = document.getElementById("add-btn");

if (addBtn) {

    addBtn.addEventListener("click", () => {
        window.location.href = "transactions.html";
    });

}

// ==============================
// Logout
// ==============================

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {

    logoutLink.addEventListener("click", async (e) => {

        e.preventDefault();

        const confirmed = await showConfirm(t("logout-confirm"));

        if (!confirmed) return;

        AppStorage.setLoggedIn(false);

        location.replace("login.html");

    });

}

// ==============================
// Recurring Transactions
// ==============================
// عند فتح أي صفحة، نتحقق من المعاملات
// المتكررة (شهري/أسبوعي) ونولّد أي دفعات
// مستحقة تلقائيًا حتى تاريخ اليوم.
// ==============================

document.addEventListener("DOMContentLoaded", processRecurringTransactions);

function processRecurringTransactions() {

    const transactions = AppStorage.getTransactions();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let changed = false;
    const newTransactions = [];

    transactions.forEach(transaction => {

        if (!transaction.recurring) return;

        let nextDue = transaction.nextDueDate
            ? new Date(transaction.nextDueDate)
            : addInterval(new Date(transaction.date), transaction.recurring);

        // أمان: لا تولّد أكثر من 24 دفعة دفعة واحدة
        // (لو تُرك التطبيق مغلقًا لفترة طويلة جدًا)
        let safetyCounter = 0;

        while (nextDue <= today && safetyCounter < 24) {

            newTransactions.push({

                id: Date.now() + Math.floor(Math.random() * 100000),

                title: transaction.title,
                amount: transaction.amount,
                type: transaction.type,
                categoryId: transaction.categoryId,
                date: nextDue.toISOString().slice(0, 10),
                recurring: null,
                recurringSourceId: transaction.id

            });

            nextDue = addInterval(nextDue, transaction.recurring);
            changed = true;
            safetyCounter++;

        }

        transaction.nextDueDate = nextDue.toISOString().slice(0, 10);

    });

    if (changed) {

        AppStorage.saveTransactions([
            ...transactions,
            ...newTransactions
        ]);

    }

}

function addInterval(date, recurring) {

    const result = new Date(date);

    if (recurring === "weekly") {

        result.setDate(result.getDate() + 7);

    } else {

        result.setMonth(result.getMonth() + 1);

    }

    return result;

}