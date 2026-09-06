// ======================================
// Login (تسجيل دخول من جهة العميل فقط)
// ======================================
// ⚠️ لا يوجد خادم أو تحقق فعلي من كلمة
// المرور — هذه شاشة دخول بسيطة لتطبيق يعمل
// بالكامل محليًا في المتصفح. انظر التنبيه
// الظاهر أسفل نموذج الدخول في login.html.
// ======================================


// ======================================
// لو المستخدم مسجّل دخول بالفعل ودخل
// على login.html مباشرة، ننقله للوحة
// التحكم مباشرة بدل عرض نموذج الدخول
// ======================================

if (AppStorage.isLoggedIn()) {

    location.replace("dashboard.html");

}


// ======================================
// الصفحات الداخلية المسموح بالتوجيه إليها
// بعد الدخول (لمنع أي "open redirect" لو
// تم التلاعب بقيمة redirect في الرابط)
// ======================================

const ALLOWED_REDIRECTS = [
    "dashboard.html",
    "transactions.html",
    "categories.html",
    "budget.html",
    "reports.html",
    "settings.html"
];

function getRedirectTarget() {

    const params = new URLSearchParams(location.search);

    const requested = params.get("redirect");

    if (requested && ALLOWED_REDIRECTS.includes(requested)) {

        return requested;

    }

    return "dashboard.html";

}


// ======================================
// Form Submit
// ======================================

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value.trim();

        if (!email || !password) {

            showToast(t("login-error"), "error");

            return;

        }

        AppStorage.setLoggedIn(true);

        location.replace(getRedirectTarget());

    });

}
