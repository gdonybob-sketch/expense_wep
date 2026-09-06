// ======================================
// Shared Helpers
// ======================================
// دوال مشتركة تُستخدم في أكثر من صفحة
// بدل تكرارها (t, escapeHTML, formatCurrency,
// Toast, Confirm Modal)
// ======================================


// ======================================
// Category Resolution (by id)
// ======================================

function resolveCategoryLabel(categoryId) {

    if (categoryId === null || categoryId === undefined) {

        return t("uncategorized");

    }

    const category = AppStorage.getCategoryById(categoryId);

    if (!category) {

        return t("uncategorized");

    }

    return `${category.icon} ${category.name}`;

}

function resolveCategoryName(categoryId) {

    const category = AppStorage.getCategoryById(categoryId);

    return category ? category.name : t("uncategorized");

}


// ======================================
// Translation Helper (موحّد لكل الصفحات)
// ======================================

function getCurrentLanguage() {

    return AppStorage.getLanguage();

}

function t(key) {

    const language = getCurrentLanguage();

    if (
        typeof translations !== "undefined" &&
        translations[language] &&
        translations[language][key] !== undefined
    ) {

        return translations[language][key];

    }

    return key;

}


// ======================================
// XSS-Safe HTML Escaping
// ======================================
// أي نص قادم من المستخدم (عنوان معاملة،
// اسم تصنيف...) يجب تمريره هنا قبل حقنه
// داخل innerHTML، لمنع تنفيذ HTML/سكربت
// ======================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent =
        value === null || value === undefined
            ? ""
            : String(value);

    return div.innerHTML;

}


// ======================================
// Locale-Aware Currency Formatting
// ======================================

function formatCurrency(amount) {

    const language = getCurrentLanguage();

    const locale = language === "ar" ? "ar-EG" : "en-US";

    const number = Number(amount) || 0;

    return number.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ======================================
// Toast Notifications
// (بديل خفيف لـ alert() بعد الحفظ/الحذف)
// ======================================

function showToast(message, type) {

    let container = document.getElementById("toast-container");

    if (!container) {

        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);

    }

    const toast = document.createElement("div");

    toast.className =
        "app-toast" + (type ? ` app-toast-${type}` : "");

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);

    }, 2800);

}


// ======================================
// Confirm Modal
// (بديل لـ confirm() الافتراضي في المتصفح)
// يرجع Promise<boolean>
// ======================================

function showConfirm(message) {

    return new Promise(resolve => {

        const overlay = document.createElement("div");
        overlay.className = "app-modal-overlay";

        const box = document.createElement("div");
        box.className = "app-modal-box";

        const text = document.createElement("p");
        text.textContent = message;

        const actions = document.createElement("div");
        actions.className = "app-modal-actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "app-modal-cancel";
        cancelBtn.type = "button";
        cancelBtn.textContent = t("cancel");

        const confirmBtn = document.createElement("button");
        confirmBtn.className = "app-modal-confirm";
        confirmBtn.type = "button";
        confirmBtn.textContent = t("confirm");

        function close(result) {

            overlay.remove();
            resolve(result);

        }

        cancelBtn.addEventListener("click", () => close(false));
        confirmBtn.addEventListener("click", () => close(true));

        overlay.addEventListener("click", (e) => {

            if (e.target === overlay) close(false);

        });

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);

        box.appendChild(text);
        box.appendChild(actions);

        overlay.appendChild(box);

        document.body.appendChild(overlay);

        confirmBtn.focus();

    });

}


// ======================================
// Chart Skeleton Loader
// ======================================

function hideChartSkeleton(chartId) {

    const skeleton =
        document.getElementById(`${chartId}-skeleton`);

    if (skeleton) {

        skeleton.hidden = true;

    }

}

// ======================================
// Chart Unavailable Fallback
// ======================================
// تُستدعى لو فشل تحميل مكتبة Chart.js من
// الـ CDN (لا يوجد إنترنت / تم حجب الرابط)
// حتى لا يبقى شكل التحميل (skeleton) عالقًا
// للأبد بدون أي تفسير للمستخدم.
// ======================================

function isChartLibraryLoaded() {

    return typeof Chart !== "undefined";

}

function showChartUnavailable(chartId) {

    const canvas = document.getElementById(chartId);

    const skeleton = document.getElementById(`${chartId}-skeleton`);

    if (skeleton) {

        skeleton.hidden = true;

    }

    if (canvas && !document.getElementById(`${chartId}-error`)) {

        const message = document.createElement("p");

        message.id = `${chartId}-error`;
        message.className = "chart-error";
        message.textContent = t("chart-load-error");

        canvas.insertAdjacentElement("afterend", message);

        canvas.style.display = "none";

    }

}

/**
 * غلاف آمن لرسم أي مخطط: يتحقق أولًا من
 * تحميل مكتبة Chart.js، وإن لم تكن محمّلة
 * (أو حدث أي خطأ أثناء الرسم) يعرض رسالة
 * بديلة بدل ترك المستخدم بلا أي تفسير أو
 * ترك skeleton التحميل عالقًا للأبد. كل
 * مخطط مستقل عن غيره فلا يمنع فشل أحدها
 * رسم بقية المخططات.
 */
function safeDrawChart(chartId, drawFn) {

    if (!isChartLibraryLoaded()) {

        console.error(
            `Chart.js لم يتم تحميله (تحقق من الاتصال بالإنترنت) - تعذّر رسم: ${chartId}`
        );

        showChartUnavailable(chartId);

        return null;

    }

    try {

        const chartInstance = drawFn();

        hideChartSkeleton(chartId);

        return chartInstance;

    } catch (err) {

        console.error(`خطأ أثناء رسم ${chartId}:`, err);

        showChartUnavailable(chartId);

        return null;

    }

}


// ======================================
// "Local Data Only" Notice
// (تنبيه أن البيانات محفوظة في المتصفح فقط)
// ======================================

function initLocalDataNotice() {

    if (sessionStorage.getItem("hideLocalDataNotice")) return;

    const banner = document.getElementById("local-data-notice");

    if (!banner) return;

    banner.hidden = false;

    const closeBtn = banner.querySelector(".notice-close");

    if (closeBtn) {

        closeBtn.addEventListener("click", () => {

            banner.hidden = true;

            sessionStorage.setItem("hideLocalDataNotice", "1");

        });

    }

}

document.addEventListener("DOMContentLoaded", initLocalDataNotice);
