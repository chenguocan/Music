import "./icons"
import Hammer from "./Hammer.js"
/*const $=selector=>document.querySelector(selector);
const $$=selector=>document.querySelectorAll(selector);*/
class Player {
    constructor(node) {
        this.root = typeof node === "string" ? document.querySelector(node) : node;
        this.$ = (selector) => this.root.querySelector(selector);
        this.$$ = (selector) => this.root.querySelectorAll(selector);
        this.songList = [];
        this.currentIndex = 0;
        this.audio = new Audio();
        this.start();
        this.bind();
        this.lyricsArr = []
        this.lyricIndex = -1
        //https://github.com/jirengu/data-mock/tree/master/huawei-music
    }
    start() {
        fetch('http://chenguocan.cn/Huawei_api/music-list.json')
            .then(res => res.json())
            .then(data => {
                console.log(data);
                this.songList = data;
                this.audio.src = this.songList[this.currentIndex].url;
                this.renderSong();
            })
    }
    bind() {
        let self = this
        this.$(".btn-play-pause").onclick = function () {
            if (this.classList.contains("playing")) {
                self.audio.play();
                this.classList.remove("playing");
                this.classList.add("pause");
                this.querySelector("use").setAttribute("xlink:href", "#icon-pause");
            } else if (this.classList.contains("pause")) {
                self.audio.pause();
                this.classList.remove("pause");
                this.classList.add("playing");
                this.querySelector("use").setAttribute("xlink:href", "#icon-play");
            }
        }
        this.$(".btn-pre").onclick = function () {
            console.log(self.currentIndex);
            self.playPrevSong();
        }
        this.$(".btn-next").onclick = function () {
            console.log(self.currentIndex);
            self.playNextSong();
        }
        this.$(".btn-list").onclick = function () {
            console.log("音乐列表");
        }
        this.audio.ontimeupdate = function () {
            self.locateLyric();
        }
        let hammer = new Hammer(this.$(".panels"));
        let panel = this.$(".panels")
        hammer.on("swipeleft", function () {
            panel.classList.remove("panel1");
            panel.classList.add("panel2");
        })
        hammer.on("swiperight", function () {
            panel.classList.remove("panel2");
            panel.classList.add("panel1");
        })
    }
    playPrevSong() {
        this.currentIndex = (this.songList.length + this.currentIndex - 1) % this.songList.length;
        console.log(this.songList[this.currentIndex])
        this.audio.src = this.songList[this.currentIndex].url
        this.audio.play();
        this.renderSong();
    }
    playNextSong() {
        this.currentIndex = (this.songList.length + this.currentIndex + 1) % this.songList.length;
        this.audio.src = this.songList[this.currentIndex].url
        console.log(this.songList[this.currentIndex])
        this.audio.play();
        this.audio.onloadedmetadata = () => {
            this.$(".time-end").innerText = this.formateTime(this.audio.duration);
        }
        this.renderSong();
    }
    renderSong() {
        let songObj = this.songList[this.currentIndex];
        this.$(".header h1").innerHTML = songObj.title;
        this.$(".header p").innerHTML = songObj.author + "-" + songObj.albumn;
        //    this.audio.src=songObj.url;
        this.loadLyrics();
        this.audio.onloadedmetadata = () => {
            this.$(".time-end").innerText = this.formateTime(this.audio.duration);
        }
        this.loadLyrics()
    }
    loadLyrics() {
        let url = this.songList[this.currentIndex].lyric;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                this.setLyrics(data.lrc.lyric)
                window.lyrics = data.lrc.lyric
            })
    }
    setLineToCenter(node) {
        let offset = node.offsetTop - this.$(".panels .container").offsetHeight / 2;
        console.log(offset);
        offset = offset > 0 ? offset : 0
        this.$(".panels .container").style.transform = `translateY(-${offset}px)`;
        this.$$(".panels .container p").forEach(node =>
            node.classList.remove("current"));
        node.classList.add("current");
    }

    locateLyric() {
        this.setProgerssBar()
        let currentTime = this.audio.currentTime * 1000
        let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0]
        if (currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
            this.lyricIndex++
            let node = this.$('[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]')
            if (node) this.setLineToCenter(node)
            this.$$('.panel-effect .lyrics p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
            this.$$('.panel-effect .lyrics p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''
        }
    }
    setLyrics(lyrics) {
        this.lyricIndex = 0
        let fragment = document.createDocumentFragment()
        let lyricsArr = []
        this.lyricsArr = lyricsArr
        lyrics.split(/\n/)
            .filter(str => str.match(/\[.+?\]/))
            .forEach(line => {
                let str = line.replace(/\[.+?\]/g, '')
                line.match(/\[.+?\]/g).forEach(t => {
                    t = t.replace(/[\[\]]/g, '')
                    let milliseconds = parseInt(t.slice(0, 2)) * 60 * 1000 + parseInt(t.slice(3, 5)) * 1000 + parseInt(t.slice(6))
                    lyricsArr.push([milliseconds, str])
                })
            })
        lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
            if (v1[0] > v2[0]) {
                return 1
            } else {
                return -1
            }
        }).forEach(line => {
            let node = document.createElement('p')
            node.setAttribute('data-time', line[0])
            node.innerText = line[1]
            fragment.appendChild(node)
        })
        this.$('.panel-lyrics .container').innerHTML = ''
        this.$('.panel-lyrics .container').appendChild(fragment)
    }
    formateTime(secondsTotal) {
        let minutes = parseInt(secondsTotal / 60)
        minutes = minutes >= 10 ? '' + minutes : '0' + minutes
        let seconds = parseInt(secondsTotal % 60)
        seconds = seconds >= 10 ? '' + seconds : '0' + seconds
        return minutes + ':' + seconds
    }
    setProgerssBar() {
        let percent = (this.audio.currentTime * 100 / this.audio.duration) + '%'
        this.$('.bar .progress').style.width = percent
        this.$('.time-start').innerText = this.formateTime(this.audio.currentTime)
    }
}
window.p = new Player("#player")