var data;

let characterData = [{
    "jp": "星乃 一歌",
    "en": "Hoshino Ichika"
}, {
    "jp": "天馬 咲希",
    "en": "Tenma Saki"
}, {
    "jp": "望月 穂波",
    "en": "Mochizuki Honami"
}, {
    "jp": "日野森 志歩",
    "en": "Hinomori Shiho"
}, {
    "jp": "花里 みのり",
    "en": "Hanasato Minori"
}, {
    "jp": "桐谷 遥",
    "en": "Kiritani Haruka"
}, {
    "jp": "桃井 愛莉",
    "en": "Momoi Airi"
}, {
    "jp": "日野森 雫",
    "en": "Hinomori Shizuku"
}, {
    "jp": "小豆沢 こはね",
    "en": "Azusawa Kohane"
}, {
    "jp": "白石 杏",
    "en": "Shiraishi An"
}, {
    "jp": "東雲 彰人",
    "en": "Shinonome Akito"
}, {
    "jp": "青柳 冬弥",
    "en": "Aoyagi Toya"
}, {
    "jp": "天馬 司",
    "en": "Tenma Tsukasa"
}, {
    "jp": "鳳 えむ",
    "en": "Otori Emu"
}, {
    "jp": "草薙 寧々",
    "en": "Kusanagi Nene"
}, {
    "jp": "神代 類",
    "en": "Kamishiro Rui"
}, {
    "jp": "宵崎 奏",
    "en": "Yoisaki Kanade"
}, {
    "jp": "朝比奈 まふゆ",
    "en": "Asahina Mafuyu"
}, {
    "jp": "東雲 絵名",
    "en": "Shinonome Ena"
}, {
    "jp": "暁山 瑞希",
    "en": "Akiyama Mizuki"
}, {
    "jp": "初音 ミク",
    "en": "Hatsune Miku"
}, {
    "jp": "鏡音 リン",
    "en": "Kagamine Rin"
}, {
    "jp": "鏡音 レン",
    "en": "Kagamine Len"
}, {
    "jp": "巡音 ルカ",
    "en": "Megurine Luka"
}, {
    "jp": "MEIKO"
}, {
    "jp": "KAITO"
}];

const MAX_RANK = 200;

$(function () {
    makeHeader();
    loadData();
    initClicks();
    setDisplay("char", 21);
});

function makeHeader() {
    // Make VS header
    let div = makeUnitDiv(6);
    $("#header").append(div);
    for (let i = 1; i <= 5; i++) {
        let div = makeUnitDiv(i);
        $("#header").append(div);
    }
    $("#header").append(`<div class="ddButton headerButton"></div>`);
}

function makeUnitDiv(id) {
    let unitDiv = $(`<div class="unitDiv"></div>`);
    let unitButton = $(`<div class="unitButton headerButton" unit-id="${id}"></div>`);
    unitButton.css("background-image", `url("https://tsukasa-tenma.github.io/sekai-ranks/static/img/unit_${id}.png")`);
    unitDiv.append(unitButton);
    let minChar = 1 + 4 * (id - 1);
    let maxChar = minChar + 4;
    if (id == 6) {
        maxChar += 2;
    }
    for (let i = minChar; i < maxChar; i++) {
        let charButton = $(`<div class="charButton headerButton" char-id="${i}"></div>`);
        charButton.css("background-image", `url("https://tsukasa-tenma.github.io/sekai-ranks/static/img/char_${i}.png")`);
        unitDiv.append(charButton);
    }
    return unitDiv;
}

function loadData() {
    data = JSON.parse($("#data").text());
}

function initClicks() {
    $(".unitButton").click(function (evt) {
        let id = parseInt($(evt.currentTarget).attr("unit-id"));
        setDisplay("unit", id);
    });
    $(".charButton").click(function (evt) {
        let id = parseInt($(evt.currentTarget).attr("char-id"));
        setDisplay("char", id);
    });
    $(".ddButton").click(function (evt) {
        setDisplay("dd", 0);
    });
}

async function setDisplay(displayType, displayId) {
    $("#character").removeClass("characterIn");
    await sleep(10);
    $("#character").addClass("characterIn");
    if (displayType == "char") {
        let nameInfo = characterData[displayId - 1];
        $("#nameJP").text(nameInfo.jp);
        if (nameInfo.en) {
            $("#nameEN").text(nameInfo.en);
        } else {
            $("#nameEN").text("");
        }
        $("#characterImage").css("background-image", `url(https://tsukasa-tenma.github.io/sekai-ranks/static/img/chr_trim_${displayId}.png)`);
        $("#characterImage").css("background-position", "bottom center");
        $("#characterImage").css("width", "100%");
        $("#characterName").show();
        setLeaderboard(displayId, displayId);
    } else {
        $("#characterName").hide();
        if (displayType == "unit") {
            $("#characterImage").css("background-image", `url(https://tsukasa-tenma.github.io/sekai-ranks/static/img/unit_${displayId}.png)`);
            $("#characterImage").css("background-position", "center center");
            $("#characterImage").css("width", "75%");
            if (displayId < 6) {
                setLeaderboard(4 * (displayId - 1) + 1, 4 * (displayId - 1) + 4);
            } else if (displayId == 6) {
                setLeaderboard(21, 26);
            }
        } else if (displayType == "dd") {
            $("#characterImage").css("background-image", `url(https://tsukasa-tenma.github.io/sekai-ranks/static/img/dd.gif)`);
            $("#characterImage").css("background-position", "center center");
            $("#characterImage").css("width", "40%");
            setLeaderboard(1, 26);
        }
    }
}

function setLeaderboard(minId, maxId) {
    $("#table").empty();
    let divs = [];
    let nameDivs = [];
    let hasUser = [];
    for (let i = 0; i <= MAX_RANK; i++) {
        let div = $(`<div class="row"></div>`);
        div.append(`<div class="crNumber">${i}</div>`);
        let nameDiv = $(`<div class="crNames" cr-id="${i}"></div>`);
        div.append(nameDiv);
        divs.push(div);
        nameDivs.push(nameDiv);
        hasUser.push(false);
    }
    let maxRank = 0;
    for (let i = 0; i < data.length; i++) {
        let user = data[i];
        let minRank = 1000;
        for (let j = minId-1; j <= maxId-1; j++) {
            if (user.cr[j] < minRank) {
                minRank = user.cr[j];
            }
        }
        if (minRank > maxRank) {
            maxRank = minRank;
        }
        let span = $(`<span></span>`);
        span.text(user.name);
        nameDivs[minRank].append(span);
        hasUser[minRank] = true;
    }
    for (let i = 0; i <= MAX_RANK; i++) {
        if (!hasUser[i]) {
            divs[i].find(".crNumber").text("");
        }
        if (i <= maxRank && i > 0) {
            $("#table").prepend(divs[i]);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
