
"use strict";

// ===============================
// SUBJECT OPEN KARNA BY NITIN
// ===============================
function showSubject(subject) {
    const subjectMenu = document.getElementById("subjectMenu");

    document.querySelectorAll(".subject-content").forEach(section => {
        section.hidden = true;
    });

    hideAllClasses();

    const selectedSubject = document.querySelector(
        `.subject-content[data-subject="${subject}"]`
    );

    if (!selectedSubject) {
        console.error("Subject nahi mila:", subject);
        alert("Subject nahi mila. HTML mein data-subject check karo.");
        return;
    }

    if (subjectMenu) {
        subjectMenu.hidden = true;
    }

    selectedSubject.hidden = false;

    showLanguage("hindi");
    showClass12Language("hindi");

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// ===============================
// SABHI CLASSES BAND KARNA BY NITIN
// ===============================
function hideAllClasses() {
    document.querySelectorAll("#class11, #class12").forEach(section => {
        section.hidden = true;
    });
}


// ===============================
// SUBJECT MENU PAR WAPAS JANA BY NITIN
// ===============================
function goBack() {
    document.querySelectorAll(".subject-content").forEach(section => {
        section.hidden = true;
    });

    hideAllClasses();

    const subjectMenu = document.getElementById("subjectMenu");

    if (subjectMenu) {
        subjectMenu.hidden = false;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// ===============================
// CLASS 11 HINDI / ENGLISH BY NITIN
// ===============================
function showLanguage(language) {
    document.querySelectorAll(".hindi-notes").forEach(note => {
        if (!note.classList.contains("class12-hindi-notes")) {
            note.hidden = language !== "hindi";
        }
    });

    document.querySelectorAll(".english-notes").forEach(note => {
        if (!note.classList.contains("class12-english-notes")) {
            note.hidden = language !== "english";
        }
    });

    const hindiBtn = document.getElementById("hindiBtn");
    const englishBtn = document.getElementById("englishBtn");

    if (hindiBtn) {
        hindiBtn.classList.toggle("active", language === "hindi");
    }

    if (englishBtn) {
        englishBtn.classList.toggle("active", language === "english");
    }
}


// ===============================
// CLASS 12 HINDI / ENGLISH BY NITIN
// ===============================
function showClass12Language(language) {
    document.querySelectorAll(".class12-hindi-notes").forEach(note => {
        note.hidden = language !== "hindi";
    });

    document.querySelectorAll(".class12-english-notes").forEach(note => {
        note.hidden = language !== "english";
    });

    document.querySelectorAll(".class12-language-buttons button").forEach(button => {
        const onclickText = button.getAttribute("onclick") || "";

        button.classList.toggle(
            "active",
            onclickText.includes("'" + language + "'")
        );
    });
}


// ===============================
// CLASS 11 / CLASS 12 KHOLNA BY NITIN
// ===============================
function showClass(classNumber) {
    const number = Number(classNumber);

    const class11 = document.getElementById("class11");
    const class12 = document.getElementById("class12");

    if (!class11 || !class12) {
        console.error("Class IDs:", { class11, class12 });
        alert("HTML mein class11 ya class12 ki ID nahi mili.");
        return;
    }

    // Dono ko pehle hide karo
    class11.hidden = true;
    class12.hidden = true;

    let selectedClass;

    if (number === 11) {
        selectedClass = class11;
        showLanguage("hindi");
    } else if (number === 12) {
        selectedClass = class12;
        showClass12Language("hindi");
    } else {
        console.error("Invalid class number:", classNumber);
        return;
    }

    // Selected class ko visible karo
    selectedClass.hidden = false;

    console.log("Selected class:", number);
    console.log("Hidden status:", selectedClass.hidden);
    console.log("Display style:", getComputedStyle(selectedClass).display);

    selectedClass.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


const allDetails = document.querySelectorAll(".chapters details");

allDetails.forEach(function (item) {
    item.addEventListener("toggle", function () {
        if (item.open) {
            allDetails.forEach(function (otherItem) {
                if (otherItem !== item && otherItem.open) {
                    otherItem.open = false;
                }
            });
        }
    });
});




document.addEventListener("DOMContentLoaded", function () {

    const section = document.querySelector("#chemistrySection");

    // Chemistry section नहीं है तो कोड रोक दो
    if (!section) return;

    const classButtons = section.querySelectorAll(".chem-class-btn");
    const classPanels = section.querySelectorAll(".chem-class-content");

    // Class 11 और Class 12 के बटन
    classButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedClass = button.dataset.class;

            // सभी Classes छिपाओ
            classPanels.forEach(function (panel) {
                panel.hidden = true;
            });

            // सभी Class Buttons से active हटाओ
            classButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            // चुनी हुई Class दिखाओ
            const selectedPanel = section.querySelector(
                "#chemistryClass" + selectedClass
            );

            if (!selectedPanel) return;

            selectedPanel.hidden = false;
            button.classList.add("active");

            // Class बदलने पर Notes छिपाओ
            selectedPanel
                .querySelectorAll(".chem-notes-content")
                .forEach(function (notes) {
                    notes.hidden = true;
                });

            // Language Buttons से active हटाओ
            selectedPanel
                .querySelectorAll(".chem-lang-btn")
                .forEach(function (btn) {
                    btn.classList.remove("active");
                });

        });

    });


    // Hindi और English Notes के बटन
    section.querySelectorAll(".chem-lang-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedLanguage = button.dataset.language;
            const classPanel = button.closest(".chem-class-content");

            if (!classPanel) return;

            // सभी Notes छिपाओ
            classPanel
                .querySelectorAll(".chem-notes-content")
                .forEach(function (notes) {
                    notes.hidden = true;
                });

            // सभी Language Buttons से active हटाओ
            classPanel
                .querySelectorAll(".chem-lang-btn")
                .forEach(function (btn) {
                    btn.classList.remove("active");
                });

            // Class Number प्राप्त करो
            const classNumber = classPanel.id.replace(
                "chemistryClass",
                ""
            );

            // Notes की ID बनाओ
            const notesId =
                "chem" +
                classNumber +
                (selectedLanguage === "hindi" ? "Hindi" : "English");

            const selectedNotes = section.querySelector("#" + notesId);

            // चुने हुए Notes दिखाओ
            if (selectedNotes) {
                selectedNotes.hidden = false;
                button.classList.add("active");
            }

        });

    });

});


document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // CLASS SELECTION
    // =========================

    const classButtons = document.querySelectorAll(".chem-class-btn");
    const classContents = document.querySelectorAll(".chem-class-content");

    classButtons.forEach(button => {

        button.addEventListener("click", function () {

            const classNumber = this.dataset.class;

            classContents.forEach(content => {
                content.hidden = true;
            });

            classButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            const selectedClass = document.getElementById(
                "chemistryClass" + classNumber
            );

            if (selectedClass) {
                selectedClass.hidden = false;
            }

            this.classList.add("active");

        });

    });


    // =========================
    // LANGUAGE SELECTION
    // =========================

    document.querySelectorAll(".chem-class-content").forEach(classBox => {

        const languageButtons = classBox.querySelectorAll(".chem-lang-btn");
        const notesContents = classBox.querySelectorAll(".chem-notes-content");

        languageButtons.forEach(button => {

            button.addEventListener("click", function () {

                const language = this.dataset.language;
                const classNumber = classBox.id.replace("chemistryClass", "");

                notesContents.forEach(content => {
                    content.hidden = true;
                });

                languageButtons.forEach(btn => {
                    btn.classList.remove("active");
                });

                const languageName =
                    language.charAt(0).toUpperCase() + language.slice(1);

                const selectedNotes = document.getElementById(
                    "chem" + classNumber + languageName
                );

                if (selectedNotes) {
                    selectedNotes.hidden = false;
                }

                this.classList.add("active");

            });

        });

    });


    // =========================
    // CHAPTER SELECTION
    // =========================

    document.querySelectorAll(".chem-notes-content").forEach(notesBox => {

        const chapterButtons = notesBox.querySelectorAll(".chapter-btn");
        const chapterContents = notesBox.querySelectorAll(".chapter-content");

        chapterButtons.forEach(button => {

            button.addEventListener("click", function () {

                const chapterId = this.dataset.chapter;

                const selectedChapter = notesBox.querySelector(
                    "#" + chapterId
                );

                if (!selectedChapter) {
                    console.error("Chapter नहीं मिला:", chapterId);
                    return;
                }

                chapterContents.forEach(content => {
                    content.hidden = true;
                });

                chapterButtons.forEach(btn => {
                    btn.classList.remove("active");
                });

                selectedChapter.hidden = false;

                this.classList.add("active");

            });

        });

    });

});

