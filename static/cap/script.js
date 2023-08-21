var musicMasterData;
const DIFF_NAMES = ['easy', 'normal', 'hard', 'expert', 'master'];
const DIFF_COLORS = [[134, 218, 69], [95, 184, 233], [243, 174, 60], [220, 82, 104], [172, 62, 230]];
var showingLevel = 26;
var editing = false;
var edits = [];
var drake;
var userData;

$(async function () {
    $("#editBar").hide();
    await getFiles();
    makeHeader();
    initDrag();
    $(".editBarSave").click(function() {
        submitRatings();
    })
    clearQueryString();
    let data = loadData();
    userData = data;
    showSongList(26, data.edit);
    updateEdits();
    console.log(data);
});

function makeHeader() {
    $("#header").empty();
    for (let i = 26; i <= 32; i++) {
        let div = $(`<div class="diffNum" diff-id="${i}">${i}</div>`);
        div.click(function () {
            showSongList(i, editing);
        });
        $("#header").append(div);
    }
}

async function getFiles() {
    let musicData = await $.ajax("https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/musics.json");
    musicData = JSON.parse(musicData);
    let diffData = await $.ajax("https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/musicDifficulties.json");
    diffData = JSON.parse(diffData);
    let musics = [];
    for (let i = 0; i < musicData.length; i++) {
        musics.push({
            id: musicData[i].id,
            title: musicData[i].title,
            diff: [0, 0, 0, 0, 0],
            cc: [0, 0, 0, 0, 0]
        });
    }
    for (let i = 0; i < diffData.length; i++) {
        let dd = diffData[i];
        let id = dd.musicId;
        let song = musics.find(function (a) {
            return a.id == id;
        });
        let diffId = DIFF_NAMES.findIndex(function (a) {
            return a == dd.musicDifficulty;
        });
        song.diff[diffId] = dd.playLevel;
        song.cc[diffId] = dd.playLevel;
        song.decided = [false, false, false, false, false];
    }
    masterMusicData = musics;
}

async function showSongList(level, editMode) {
    showingLevel = level;
    editing = editMode;
    $(".diffNum").removeClass("diffSelected");
    $(`.diffNum[diff-id="${level}"]`).addClass("diffSelected");
    $("#songList").empty();
    $("#editBarSongs").empty();
    let ccDivs = [];
    for (let i = 0; i < 11; i++) {
        let div = $(`<div class="row"></div>`);
        let num = level;
        if (i < 10) {
            num = level + "." + (9 - i);
        } else {
            num = level + ".?";
        }
        div.append(`<div class="crNumber wide${i == 10 ? " gray" : ""}">${num}</div>`);
        div.append(`<div class="ccSongs${editMode ? " canDrag" : ""}" cc-id="${9-i}"></div>`);
        $("#songList").append(div);
        if (i == 9 && !editMode) {
            $("#songList").append(`<div class="tableGap"></div>`);
        }
        ccDivs.push(div);
    }
    if (editMode) {
        ccDivs[10].hide();
    }
    for (let i = 0; i < masterMusicData.length; i++) {
        let song = masterMusicData[i];
        for (let j = 0; j < 5; j++) {
            if (song.diff[j] == level) {
                let div = $(`<div class="ccSong" song-id="${song.id}" diff-id="${j}"></div>`);
                let dc = DIFF_COLORS[j];
                let color = `rgb(${dc[0]},${dc[1]},${dc[2]})`;
                div.css({
                    "background-image": getJacketImage(song.id),
                    "border": `2px solid ${color}`,
                    "background-color": color
                });
                if (editMode) {
                    let existingData = userData.ratings.find(function(a) {
                        return a.song == song.id && a.diff == j;
                    });
                    let existingEdit = edits.find(function (a) {
                        return a.song == song.id && a.diff == j;
                    });
                    if (existingEdit && existingEdit.cc > -1) {
                        ccDivs[9 - existingEdit.cc].find(".ccSongs").append(div);
                    }
                    else if (existingData && existingData.cc > -1) {
                        ccDivs[9 - existingData.cc].find(".ccSongs").append(div);
                    }
                    else {
                         $("#editBarSongs").append(div);
                    }
                } else {
                    let ccDiv = 10;
                    if (song.decided[j]) {
                        ccDiv = 9 - Math.round((song.cc[j] - song.diff[j]) * 10);
                    }
                    ccDivs[ccDiv].find(".ccSongs").append(div);
                }
            }
        }
    }
    if (editMode) {
        $("#editBar").show();
        updateEdits();
    }
}

function getJacketImage(id) {
    let songIdCode = id + "";
    while (songIdCode.length < 3) {
        songIdCode = "0" + songIdCode;
    }
    return `url(https://storage.sekai.best/sekai-assets/music/jacket/jacket_s_${songIdCode}_rip/jacket_s_${songIdCode}.png)`;
}

function initDrag() {
    drake = dragula({
        isContainer: function (el) {
            return el.classList.contains('canDrag');;
        },
        accepts: function (el) {
            return el.classList.contains('ccSong');
        }
    });
    drake.on("drop", function (el, target, source, sibling) {
        let songId = $(el).attr("song-id");
        let diffId = $(el).attr("diff-id");
        let cc = $(target).attr("cc-id");
        editCC(parseInt(songId), parseInt(diffId), parseInt(cc));
    });
}

function editCC(songId, diffId, cc) {
    if (!editing) {
        return;
    }
    let existingEdit = edits.find(function (a) {
        return a.song == songId && a.diff == diffId;
    });
    if (existingEdit) {
        existingEdit.cc = cc;
    } else {
        edits.push({
            song: songId,
            diff: diffId,
            cc: cc
        });
    }
    updateEdits();
}

function updateEdits() {
    $(".editBarCount").text(`${edits.length} edit${edits.length == 1 ? "" : "s"}`);
    $(".ccSong").removeClass("edited");
    for (let i = 0; i < edits.length; i++) {
        $(`.ccSong[song-id="${edits[i].song}"][diff-id="${edits[i].diff}"]`).addClass("edited");
    }
}

function clearQueryString() {
    let baseUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, baseUrl);
}

function loadData() {
    let text = $("#data").text();
    if (text == "{{data}}") {
        return {
            "edit": true
        };
    }
    let data = JSON.parse(text);
    return data;
}

function submitRatings() {
    let ratingData = {
        "user": userData.user,
        "key": userData.key,
        "edits": edits
    }
    console.log(ratingData);
    $.ajax({
        url: "/cap/submit",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(ratingData),
        success: function (response) {
            response = JSON.parse(response);
            console.log(response);
            if (response.success) {
                edits = [];
                updateEdits();
            }
            else {
                alert(response.message);
            }  
        },
        error: function (error) {
            console.log(error); // Handle errors here
        }
    });
}
