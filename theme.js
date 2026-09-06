// ======================================
// Theme System
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const themeBtn = document.getElementById("theme-btn");

    // تطبيق الوضع المحفوظ
    const savedTheme = AppStorage.getTheme();

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

    } else {

        document.body.classList.remove("dark");

    }


    // زر الوضع الداكن
    if (themeBtn) {

        themeBtn.addEventListener("click", function () {

            document.body.classList.toggle("dark");

            const isDark =
                document.body.classList.contains("dark");

            if (isDark) {

                AppStorage.saveTheme("dark");

            } else {

                AppStorage.saveTheme("light");

            }

            updateThemeButton(isDark);

        });

    }


    // تحديث شكل الزر عند فتح الصفحة
    updateThemeButton(
        document.body.classList.contains("dark")
    );

});


// ======================================
// تحديث زر الوضع
// ======================================

function updateThemeButton(isDark) {

    const themeBtn = document.getElementById("theme-btn");

    if (!themeBtn) return;

    if (isDark) {

        themeBtn.textContent = "☀️";

        themeBtn.title = "Light Mode";

    } else {

        themeBtn.textContent = "🌙";

        themeBtn.title = "Dark Mode";

    }

}