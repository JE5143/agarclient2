(function(wHandle, wjQuery) { /*global navigator, Image, $*/
    if (navigator.appVersion.indexOf("MSIE") != -1) alert(
        "You're using a pretty old browser, some parts of the site may not work properly!"
    );
    Date.now || (Date.now = function() {
        return (+new Date()).getTime();
    });
    var DATE = Date.now();
    Array.prototype.peek = function() {
        return this[this.length - 1];
    };
    Array.prototype.remove = function(a) {
        var i = this.indexOf(a);
        if (i !== -1) this.splice(i, 1);
        return i !== -1;
    };
    function bytesToColor(r, g, b) {
        var r1 = ("00" + (~~r).toString(16)).slice(-2),
            g1 = ("00" + (~~g).toString(16)).slice(-2),
            b1 = ("00" + (~~b).toString(16)).slice(-2);
        return `#${r1}${g1}${b1}`;
    }
    function colorToBytes(color) {
        if (color.length === 4) return {
            r: parseInt(color[1] + color[1], 16),
            g: parseInt(color[2] + color[2], 16),
            b: parseInt(color[3] + color[3], 16)
        };
        else if (color.length === 7) return {
            r: parseInt(color[1] + color[2], 16),
            g: parseInt(color[3] + color[4], 16),
            b: parseInt(color[5] + color[6], 16)
        };
        throw new Error(`Invalid color ${color}!`);
    }
    function darkenColor(color) {
        var c = colorToBytes(color);
        return bytesToColor(c.r * .9, c.g * .9, c.b * .9);
    }
    function cleanupObject(object) {for (var i in object) delete object[i]}
    var _buffer = new DataView(new ArrayBuffer(8));
    function Writer(littleEndian) {
        this._e = littleEndian;
        this.reset();
        return this;
    }
    Writer.prototype = {
        writer: 1,
        reset: function(littleEndian) {
            this._b = [];
            this._o = 0;
        },
        setUint8: function(a) {
            if (a >= 0 && a < 256) this._b.push(a);
            return this;
        },
        setInt8: function(a) {
            if (a >= -128 && a < 128) this._b.push(a);
            return this;
        },
        setUint16: function(a) {
            _buffer.setUint16(0, a, this._e);
            this._move(2);
            return this;
        },
        setInt16: function(a) {
            _buffer.setInt16(0, a, this._e);
            this._move(2);
            return this;
        },
        setUint32: function(a) {
            _buffer.setUint32(0, a, this._e);
            this._move(4);
            return this;
        },
        setInt32: function(a) {
            _buffer.setInt32(0, a, this._e);
            this._move(4);
            return this;
        },
        setFloat32: function(a) {
            _buffer.setFloat32(0, a, this._e);
            this._move(4);
            return this;
        },
        setFloat64: function(a) {
            _buffer.setFloat64(0, a, this._e);
            this._move(8);
            return this;
        },
        _move: function(b) {
            for (var i = 0; i < b; i++) this._b.push(_buffer.getUint8(i));
        },
        setStringUTF8: function(s) {
            var bytesStr = unescape(encodeURIComponent(s));
            for (var i = 0, l = bytesStr.length; i < l; i++) this._b.push(bytesStr.charCodeAt(i));
            this._b.push(0);
            return this;
        },
        build: function() {
            return new Uint8Array(this._b);
        }
    };
    function Reader(view, offset, littleEndian) {
        this._e = littleEndian;
        if (view) this.repurpose(view, offset);
    }
    Reader.prototype = {
        reader: 1,
        repurpose: function(view, offset) {
            this.view = view;
            this._o = offset || 0;
        },
        getUint8: function() {
            return this.view.getUint8(this._o++, this._e);
        },
        getInt8: function() {
            return this.view.getInt8(this._o++, this._e);
        },
        getUint16: function() {
            return this.view.getUint16((this._o += 2) - 2, this._e);
        },
        getInt16: function() {
            return this.view.getInt16((this._o += 2) - 2, this._e);
        },
        getUint32: function() {
            return this.view.getUint32((this._o += 4) - 4, this._e);
        },
        getInt32: function() {
            return this.view.getInt32((this._o += 4) - 4, this._e);
        },
        getFloat32: function() {
            return this.view.getFloat32((this._o += 4) - 4, this._e);
        },
        getFloat64: function() {
            return this.view.getFloat64((this._o += 8) - 8, this._e);
        },
        getStringUTF8: function() {
            var s = "", b;
            while ((b = this.view.getUint8(this._o++)) !== 0) s += String.fromCharCode(b);
            return decodeURIComponent(escape(s));
        }
    };
    var log = {
        verbosity: 4,
        error: function(a) {if (log.verbosity <= 0) return; console.error(a)},
        warn: function(a) {if (log.verbosity <= 1) return; console.warn(a)},
        info: function(a) {if (log.verbosity <= 2) return; console.info(a)},
        debug: function(a) {if (log.verbosity <= 3) return; console.debug(a)}
    };
    var WS_URL = null;
    var SKIN_URL = "../../skins/";
    var USE_HTTPS = "https:" == wHandle.location.protocol;
    var UINT8_254 = new Uint8Array([254, 6, 0, 0, 0]);
    var UINT8_255 = new Uint8Array([255, 1, 0, 0, 0]);
    var UINT8 = {
        1: new Uint8Array([1]),
        17: new Uint8Array([17]),
        21: new Uint8Array([21]),
        18: new Uint8Array([18]),
        19: new Uint8Array([19]),
        22: new Uint8Array([22]),
        23: new Uint8Array([23]),
        24: new Uint8Array([24]),
        25: new Uint8Array([25]),
        26: new Uint8Array([26]),
        27: new Uint8Array([27]),
        28: new Uint8Array([28]),
        30: new Uint8Array([30]),
        31: new Uint8Array([31]),
        29: new Uint8Array([29]),
        33: new Uint8Array([33]),
        34: new Uint8Array([34]),
        35: new Uint8Array([35]),
        36: new Uint8Array([36]),
        37: new Uint8Array([37]),
        38: new Uint8Array([38]),
        39: new Uint8Array([39]),
        40: new Uint8Array([40]),
        41: new Uint8Array([41]),
        42: new Uint8Array([42]),
        43: new Uint8Array([43]),
        254: new Uint8Array([254])
    };
    function wsCleanup() {
        if (!ws) return;
        log.debug("WS cleanup triggered!");
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
        ws = null;
    }
    function wsInit(url) {
        if (ws) log.debug("WS init on existing connection!"), wsCleanup();
        wjQuery("#connecting").show();
        ws = new WebSocket(`ws${USE_HTTPS ? "s" : ""}://${WS_URL = url}`);
        ws.binaryType = "arraybuffer";
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = wsError;
        ws.onclose = wsClose;
    }
    function wsOpen() {
        isConnected = 1;
        disconnectDelay = 1000;
        wjQuery("#connecting").hide();
        wsSend(UINT8_254);
        wsSend(UINT8_255);
        log.debug(`WS connected, using https: ${USE_HTTPS}`);
        console.log("Socket open");
    }
    function wsError(error) {
        log.warn(error);
        /*throw new Error*/console.log("Socket error");
    }
    function wsClose(e) {
        isConnected = 0;
        log.debug(`WS disconnected ${e.code} '${e.reason}'`);
        wsCleanup();
        gameReset();
        setTimeout(function() {
            if (ws && ws.readyState === 1) return;
            wsInit(WS_URL);
        }, disconnectDelay *= 1.5);
        console.log("Socket closed");
    }
    function wsSend(data) {
        if (!ws) return;
        if (ws.readyState !== 1) return;
        if (data.build) ws.send(data.build());
        else ws.send(data);
    }
    function wsMessage(data) {
        syncUpdStamp = Date.now();
        var reader = new Reader(new DataView(data.data), 0, 1);
        var packetId = reader.getUint8();
        switch (packetId) {
            case 0x10: // update nodes
                var killer, killed, id, x, y, s, flags, cell,
                    updColor, updName, updSkin, count, color, name, skin;
                // consume records
                count = reader.getUint16();
                for (var i = 0; i < count; i++) {
                    killer = reader.getUint32();
                    killed = reader.getUint32();
                    if (!cells.byId.hasOwnProperty(killer) || !cells.byId.hasOwnProperty(killed)) continue;
                    cells.byId[killed].destroy(killer);
                }
                // update records
                while (1) {
                    id = reader.getUint32();
                    if (id === 0) break;
                    x = reader.getInt32();
                    y = reader.getInt32();
                    s = reader.getUint16();
                    flags = reader.getUint8();
                    updColor = !!(flags & 0x02);
                    updName = !!(flags & 0x08);
                    updSkin = !!(flags & 0x04);
                    color = updColor ? bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8()) : null;
                    skin = updSkin ? reader.getStringUTF8() : null;
                    name = updName ? reader.getStringUTF8() : null;
                    if (cells.byId.hasOwnProperty(id)) {
                        cell = cells.byId[id];
                        cell.update(syncUpdStamp);
                        cell.updated = syncUpdStamp;
                        cell.ox = cell.x;
                        cell.oy = cell.y;
                        cell.os = cell.s;
                        cell.nx = x;
                        cell.ny = y;
                        cell.ns = s;
                        if (color) cell.setColor(color);
                        if (skin) cell.setSkin(skin);
                        if (name) cell.setName(name);
                    } else {
                        cell = new Cell(id, x, y, s, name, color, skin, flags);
                        cells.byId[id] = cell;
                        cells.list.push(cell);
                    }
                }
                // dissapear records
                count = reader.getUint16();
                for (i = 0; i < count; i++) {
                    killed = reader.getUint32();
                    if (cells.byId.hasOwnProperty(killed) && !cells.byId[killed].destroyed)
                        cells.byId[killed].destroy(null);
                }
                break;
            case 0x11: // update pos
                targetX = reader.getFloat32();
                targetY = reader.getFloat32();
                targetZ = reader.getFloat32();
                break;
            case 0x12: // clear all
                for (var i in cells.byId) cells.byId[i].destroy(null);
            case 0x14: // clear my cells
                cells.mine = [];
                break;
            case 0x15: // draw line
                log.warn("Got packet 0x15 (draw line) which is unsupported!");
                break;
            case 0x20: // new cell
                cells.mine.push(reader.getUint32());
                break;
            case 0x30: // text list
                leaderboard.items = [];
                leaderboard.type = "text";
                count = reader.getUint32();
                for (i = 0; i < count; ++i) leaderboard.items.push(reader.getStringUTF8());
                drawLeaderboard();
                break;
            case 0x31: // ffa list
                leaderboard.items = [];
                leaderboard.type = "ffa";
                count = reader.getUint32();
                for (i = 0; i < count; ++i) {
                    leaderboard.items.push({
                        me: !!reader.getUint32(),
                        name: reader.getStringUTF8() || "An unnamed cell"
                    });
                }
                drawLeaderboard();
                break;
            case 0x32: // pie chart for teams
                leaderboard.items = [];
                leaderboard.type = "pie";
                count = reader.getUint32();
                for (i = 0; i < count; ++i) leaderboard.items.push(reader.getFloat32());
                drawLeaderboard();
                break;
            case 0x40: // set border
                border.left = reader.getFloat64();
                border.top = reader.getFloat64();
                border.right = reader.getFloat64();
                border.bottom = reader.getFloat64();
                border.width = border.right - border.left;
                border.height = border.bottom - border.top;
                border.centerX = (border.left + border.right) / 2;
                border.centerY = (border.top + border.bottom) / 2;
                if (data.data.byteLength === 33) break;
                if (!mapCenterSet) {
                    mapCenterSet = 1;
                    cameraX = targetX = border.centerX;
                    cameraY = targetY = border.centerY;
                    cameraZ = targetZ = 1;
                }
                reader.getUint32(); // game type
                if (!/MultiOgar/.test(reader.getStringUTF8()) || stats.pingLoopId) break;
                stats.pingLoopId = setInterval(function() {
                    wsSend(UINT8[254]);
                    stats.pingLoopStamp = Date.now();
                }, 2000);
                break;
            case 0x63: // chat message
                flags = reader.getUint8();
                color = bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8());
                name = reader.getStringUTF8().trim();
                var reg = /\{([\w]+)\}/.exec(name);
                if (reg) name = name.replace(reg[0], "").trim();
                var message = reader.getStringUTF8();
                var server = !!(flags & 0x80);
                var admin = !!(flags & 0x40);
                var mod = !!(flags & 0x20);
                var Member = !!(flags & 0x10);
                var server2 = !!(flags & 0x80);
                if (server && name !== "SERVER") name = "[SERVER] " + name;
                if (admin) name = "[ADMIN] " + name;
                if (mod) name = "[MOD] " + name;
                if (Member) name = "[Member] " + name;
                if (server2) name = "[SERVER] " + name;
                var wait = Math.max(3000, 1000 + message.length * 150);
                chat.waitUntil = syncUpdStamp - chat.waitUntil > 1000 ? syncUpdStamp + wait : chat.waitUntil + wait;
                chat.messages.push({
                    server: server,
                    admin: admin,
                    mod: mod,
                    color: color,
                    name: name,
                    message: message,
                    time: syncUpdStamp
                });
                drawChat();
                break;
            case 0xFE: // server stat
                stats.info = JSON.parse(reader.getStringUTF8());
                stats.latency = syncUpdStamp - stats.pingLoopStamp;
                drawStats();
                break;
            default: // invalid packet
                wsCleanup();
                break;
        }
    }
    function sendMouseMove(x, y) {
        var writer = new Writer(1);
        writer.setUint8(0x10);
        writer.setUint32(x);
        writer.setUint32(y);
        writer._b.push(0, 0, 0, 0);
        wsSend(writer);
    }
    function sendPlay(name) {
        log.debug("Play triggered");
        var writer = new Writer(1);
        writer.setUint8(0x00);
        writer.setStringUTF8(name);
        wsSend(writer);
    }
    function sendChat(text) {
        var writer = new Writer();
        writer.setUint8(0x63);
        writer.setUint8(0);
        writer.setStringUTF8(text);
        wsSend(writer);
    }
    function gameReset() {
        cleanupObject(cells);
        cleanupObject(border);
        cleanupObject(leaderboard);
        cleanupObject(chat);
        cleanupObject(stats);
        chat.messages = [];
        leaderboard.items = [];
        cells.mine = [];
        cells.byId = {};
        cells.list = [];
        cameraX = cameraY = targetX = targetY = 0;
        cameraZ = targetZ = 1;
        mapCenterSet = 0;
    }
    var cells = Object.create({
        mine: [],
        byId: {},
        list: [],
    });
    var border = Object.create({
        left: -2000,
        right: 2000,
        top: -2000,
        bottom: 2000,
        width: 4000,
        height: 4000,
        centerX: -1,
        centerY: -1
    });
    var leaderboard = Object.create({
        type: NaN,
        items: null,
        canvas: document.createElement("canvas"),
        teams: ["#F33", "#3F3", "#33F"]
    });
    var chat = Object.create({
        messages: [],
        waitUntil: 0,
        canvas: document.createElement("canvas"),
        visible: 0,
    });
    var stats = Object.create({
        framesPerSecond: 0,
        latency: NaN,
        supports: null,
        info: null,
        pingLoopId: NaN,
        pingLoopStamp: null,
        canvas: document.createElement("canvas"),
        visible: 0,
        score: NaN,
        maxScore: 0
    });
    var ws = null,
        WS_URL = null,
        isConnected = 0,
        disconnectDelay = 1000,
        syncUpdStamp = Date.now(),
        syncAppStamp = Date.now(),
        mainCanvas = null,
        mainCtx = null,
        knownSkins = {},
        loadedSkins = {},
        overlayShown = 0,
        isTyping = 0,
        chatBox = null,
        mapCenterSet = 0,
        cameraX = 0,
        cameraY = 0,
        cameraZ = 1,
        cameraZInvd = 1,
        targetX = 0,
        targetY = 0,
        targetZ = 1,
        viewMult = 1,
        mouseX = NaN,
        mouseY = NaN,
        mouseZ = 1;
    var settings = {
        mobile: "createTouch" in document,
        showMass: 1,
        showNames: 1,
        hideChat: 0,
        showTextOutline: 1,
        showColor: 1,
        showSkins: 1,
        showMinimap: 1,
        darkTheme: 0,
        hideGrid: 1,
        cellBorders: 1,
        infiniteZoom: 1,
        transparency: 0,
        mapBorders: 1,
        sectors: 0,
        showPos: 0,
        hideFood: 0,
        allowGETipSet: 1
    };
    var pressed = {
        space: 0,
        w: 0,
        e: 0,
        r: 0,
        t: 0,
        p: 0,
        q: 0,
        o: 0,
        m: 0,
        i: 0,
        y: 0,
        u: 0,
        k: 0,
        l: 0,
        h: 0,
        z: 0,
        x: 0,
        s: 0,
        c: 0,
        g: 0,
        j: 0,
        b: 0,
        v: 0,
        n: 0,
        esc: 0
    };
    if (null !== wHandle.localStorage) {
        wjQuery(window).load(function() {
            wjQuery(".save").each(function() {
                var id = wjQuery(this).data("box-id");
                var value = wHandle.localStorage.getItem("checkbox-" + id);
                if (value && value == "1" && 0 != id) {
                    wjQuery(this).prop("checked", "1");
                    wjQuery(this).trigger("change");
                } else if (id == 0 && value != null) wjQuery(this).val(value);
            });
            wjQuery(".save").change(function() {
                var id = wjQuery(this).data("box-id");
                var value = (id == 0) ? wjQuery(this).val() : wjQuery(this).prop("checked");
                wHandle.localStorage.setItem("checkbox-" + id, value);
            });
        });
    }
    function hideOverlay() {
        overlayShown = 0;
        wjQuery("#overlays").fadeOut(200);
    }
    function showOverlay() {
        overlayShown = 1;
        wjQuery("#overlays").fadeIn(300);
    }
    function toCamera(ctx) {
        ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
        scaleForth(ctx);
        ctx.translate(-cameraX, -cameraY);
    }
    function scaleForth(ctx) {ctx.scale(cameraZ, cameraZ)}
    function scaleBack(ctx) {ctx.scale(cameraZInvd, cameraZInvd)}
    function fromCamera(ctx) {
        ctx.translate(cameraX, cameraY);
        scaleBack(ctx);
        ctx.translate(-mainCanvas.width / 2, -mainCanvas.height / 2);
    }
    function drawChat() {
        if (chat.messages.length === 0 && !settings.hideChat) return;
        var canvas = chat.canvas;
        var ctx = canvas.getContext("2d");
        var latestMessages = chat.messages.slice(-15);
        var lines = [];
        for (var i = 0, len = latestMessages.length; i < len; i++) {
            lines.push([
                {text: latestMessages[i].name,
                color: latestMessages[i].color},
                {text: " " + latestMessages[i].message,
                color: settings.darkTheme ? "#FFF" : "#000"}
            ]);
        }
        var width = 0;
        var height = 20 * len + 2;
        for (var i = 0; i < len; i++) {
            var thisLineWidth = 0;
            var complexes = lines[i];
            for (var j = 0; j < complexes.length; j++) {
                ctx.font = "18px Ubuntu";
                complexes[j].width = ctx.measureText(complexes[j].text).width;
                thisLineWidth += complexes[j].width;
            }
            width = Math.max(thisLineWidth, width);
        }
        canvas.width = width;
        canvas.height = height;
        for (var i = 0; i < len; i++) {
            width = 0;
            complexes = lines[i];
            for (var j = 0; j < complexes.length; j++) {
                ctx.font = "18px Ubuntu";
                ctx.fillStyle = complexes[j].color;
                ctx.fillText(complexes[j].text, width, 20 * (1 + i));
                width += complexes[j].width;
            }
        }
    }
    function drawStats() {
        if (!stats.info) return stats.visible = 0;
        stats.visible = 1;
        var canvas = stats.canvas;
        var ctx = canvas.getContext("2d");
        ctx.font = "14px Ubuntu";
        var rows = [
            `${stats.info.name} (${stats.info.mode})`,
            `${stats.info.playersTotal} / ${stats.info.playersLimit} players`,
            `${stats.info.playersAlive} playing`,
            `${stats.info.playersSpect} spectating`,
            `${(stats.info.update * 2.5).toFixed(1)}% memory load`,
            `${prettyPrintTime(stats.info.uptime)} uptime`
        ];
        var width = 0;
        for (var i = 0; i < rows.length; i++) width = Math.max(width, 2 + ctx.measureText(rows[i]).width + 2);
        canvas.width = width;
        canvas.height = rows.length * (14 + 2);
        ctx.font = "14px Ubuntu";
        ctx.fillStyle = settings.darkTheme ? "#AAA" : "#555";
        ctx.textBaseline = "top";
        for (var i = 0; i < rows.length; i++) ctx.fillText(rows[i], 2, -2 + i * (14 + 2));
    }
    function prettyPrintTime(seconds) {
        seconds = ~~seconds;
        var minutes = ~~(seconds / 60);
        if (minutes < 1) return "<1 min";
        var hours = ~~(minutes / 60);
        if (hours < 1) return minutes + " min";
        var days = ~~(hours / 24);
        if (days < 1) return hours + " hours";
        return days + " days";
    }
    function drawLeaderboard() {
        if (leaderboard.type === NaN) return leaderboard.visible = 0;
        if (!settings.showNames || leaderboard.items.length === 0) return leaderboard.visible = 0;
        leaderboard.visible = 1;
        var canvas = leaderboard.canvas;
        var ctx = canvas.getContext("2d");
        var len = leaderboard.items.length;
        canvas.width = 250;
        canvas.height = leaderboard.type !== "pie" ? 60 + 24 * len : 240;
        ctx.globalAlpha = .4;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 250, canvas.height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#FFF";
        ctx.font = "30px Ubuntu";
        ctx.fillText("Leaderboard", 125 - ctx.measureText("Leaderboard").width / 2, 40);
        if (leaderboard.type === "pie") {
            var last = 0;
            for (var i = 0; i < len; i++) {
                ctx.fillStyle = leaderboard.teams[i];
                ctx.beginPath();
                ctx.moveTo(125, 140);
                ctx.arc(125, 140, 80, last, (last += leaderboard.items[i] * Math.PI * 2), 0);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            var text, isMe = 0;
            ctx.font = "20px Ubuntu";
            for (var i = 0; i < len; i++) {
                if (leaderboard.type === "text") text = leaderboard.items[i];
                else text = leaderboard.items[i].name, isMe = leaderboard.items[i].me;
                // replace {skin} with empty string
                var reg = /\{([\w]+)\}/.exec(text);
                if (reg) text = text.replace(reg[0], "").trim();
                var string = String($("#lbColor").val());
                ctx.fillStyle = isMe ? "#" + (!string ? "FAA" : string) : "#FFF";
                if (leaderboard.type === "ffa") text = (i + 1) + ". " + (text || "An unnamed cell");
                ctx.textAlign = "left";
                ctx.fillText(text, 15, 70 + 24 * i);
            }
        }
    }
    function drawGrid() {
        mainCtx.save();
        mainCtx.lineWidth = 1;
        mainCtx.strokeStyle = settings.darkTheme ? "#AAA" : "#000";
        mainCtx.globalAlpha = .2;
        var step = 50, i,
            cW = mainCanvas.width / cameraZ,
            cH = mainCanvas.height / cameraZ,
            startLeft = (-cameraX + cW / 2) % step,
            startTop = (-cameraY + cH / 2) % step;
        scaleForth(mainCtx);
        mainCtx.beginPath();
        for (i = startLeft; i < cW; i += step) {
            mainCtx.moveTo(i, 0);
            mainCtx.lineTo(i, cH);
        }
        for (i = startTop; i < cH; i += step) {
            mainCtx.moveTo(0, i);
            mainCtx.lineTo(cW, i);
        }
        mainCtx.closePath();
        mainCtx.stroke();
        mainCtx.restore();
    }
    function drawBorders() {
        if (!isConnected || border.centerX !== 0 ||
            border.centerY !== 0 || !settings.mapBorders) return;
        mainCtx.strokeStyle = '#F00';
        mainCtx.lineWidth = 20;
        //mainCtx.lineCap = "round";
        //mainCtx.lineJoin = "round";
        mainCtx.beginPath();
        mainCtx.moveTo(border.left, border.top);
        mainCtx.lineTo(border.right, border.top);
        mainCtx.lineTo(border.right, border.bottom);
        mainCtx.lineTo(border.left, border.bottom);
        mainCtx.closePath();
        mainCtx.stroke();
    }
    function drawSectors() {
        if (!isConnected || border.centerX !== 0 ||
            border.centerY !== 0 || !settings.sectors) return;
        //mainCtx.strokeRect(border.left, border.top, 500, 500);
        var x = border.left + 65;
        var y = border.bottom - 65;
        var letter = "ABCDE".split("");
        var w = (border.right - 65 - x) / 5;
        var h = (border.top + 65 - y) / 5;
        mainCtx.save();
        mainCtx.beginPath();
        mainCtx.lineWidth = .05;
        mainCtx.textAlign = "center";
        mainCtx.textBaseline = "middle";
        mainCtx.font = w * .6 + "px Russo One";
        mainCtx.fillStyle = "#1A1A1A";
        for (var j = 0; 5 > j; j++)
            for (var i = 0; 5 > i; i++) mainCtx.fillText(letter[j] + (i + 1), x + w * j + w / 2, (-y - h) + h * -i + h / 2);
        mainCtx.lineWidth = 100;
        mainCtx.strokeStyle = "#1A1A1A";
        for (j = 0; 5 > j; j++)
            for (i = 0; 5 > i; i++) mainCtx.strokeRect(x + w * i, y + h * j, w, h);
        mainCtx.restore();
        mainCtx.stroke();
    }
    function drawMinimap() {
        // Rendered unusable when the scrambling level is 2 or more, or when there is a non-zero map center.
        if (!isConnected || border.centerX !== 0 ||
            border.centerY !== 0 || !settings.showMinimap) return;
        mainCtx.save();
        var width = 200 * (border.width / border.height),
            height = 200 * (border.height / border.width),
            beginX = mainCanvas.width / viewMult - width,
            beginY = mainCanvas.height / viewMult - height;
        mainCtx.fillStyle = "#000";
        mainCtx.globalAlpha = .4;
        mainCtx.fillRect(beginX, beginY, width, height);
        mainCtx.globalAlpha = 1;
        var sectorNames = ["ABCDE", "12345"],
            sectorWidth = width / 5,
            sectorHeight = height / 5,
            sectorNameSize = Math.min(sectorWidth, sectorHeight) / 3;
        mainCtx.fillStyle = settings.darkTheme ? "#666" : "#DDD";
        mainCtx.textBaseline = "middle";
        mainCtx.textAlign = "center";
        mainCtx.font = `${sectorNameSize}px Russo One`;
        for (var i = 0; i < 5; i++) {
            var x = sectorWidth / 2 + i * sectorWidth;
            for (var j = 0; j < 5; j++) {
                var y = sectorHeight / 2 + j * sectorHeight;
                mainCtx.fillText(`${sectorNames[0][i]}${sectorNames[1][j]}`, beginX + x, beginY + y);
            }
        }
        var scaleX = width / border.width,
            scaleY = height / border.height,
            halfWidth = border.width / 2,
            halfHeight = border.height / 2,
            posX = beginX + (cameraX + halfWidth) * scaleX,
            posY = beginY + (cameraY + halfHeight) * scaleY;
        mainCtx.beginPath();
        if (cells.mine.length) {
            for (var i = 0; i < cells.mine.length; i++) {
                var cell = cells.byId[cells.mine[i]];
                if (cell) {
                    mainCtx.fillStyle = settings.showColor ? cell.color : '#FFF';
                    x = beginX + (cell.x + halfWidth) * scaleX;
                    y = beginY + (cell.y + halfHeight) * scaleY;
                    mainCtx.moveTo(x + cell.s * scaleX, y);
                    mainCtx.arc(x, y, cell.s * scaleX, 0, Math.PI * 2);
                }
            }
        } else {
            mainCtx.fillStyle = "#FFF";
            mainCtx.arc(posX, posY, 5, 0, Math.PI * 2);
        }
        mainCtx.fill();
        // Draw name above user's pos if he has a cell on the screen
        cell = null;
        for (var i = 0, l = cells.mine.length; i < l; i++) {
            if (cells.byId.hasOwnProperty(cells.mine[i])) {
                cell = cells.byId[cells.mine[i]];
                break;
            }
        }
        if (cell !== null) {
            mainCtx.fillStyle = settings.darkTheme ? "#DDD" : "#222";
            mainCtx.font = `${sectorNameSize}px Ubuntu`;
            mainCtx.fillText(cell.name, posX, posY - 7 - sectorNameSize / 2);
        }
        mainCtx.restore();
    }
    function drawGame() {
        stats.framesPerSecond += (1000 / Math.max(Date.now() - syncAppStamp, 1) - stats.framesPerSecond) / 10;
        syncAppStamp = Date.now();
        var drawList = cells.list.slice(0).sort(cellSort);
        for (var i = 0; i < drawList.length; i++) drawList[i].update(syncAppStamp);
        cameraUpdate();
        mainCtx.save();
        mainCtx.fillStyle = settings.darkTheme ? "#111" : "#F2FBFF";
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        if (!settings.hideGrid) drawGrid();
        toCamera(mainCtx);
        drawBorders();
        drawSectors();
        for (var i = 0; i < drawList.length; i++) drawList[i].draw(mainCtx);
        fromCamera(mainCtx);
        mainCtx.scale(viewMult, viewMult);
        var height = 2;
        mainCtx.fillStyle = settings.darkTheme ? "#FFF" : "#000";
        mainCtx.textBaseline = "top";
        if (!isNaN(stats.score)) {
            mainCtx.font = "30px Ubuntu";
            if (!settings.showPos || !isConnected) var pos = "";
            else pos = `| Position: (${~~cameraX}, ${~~cameraY})`;
            mainCtx.fillText(`Score: ${stats.score} ${pos}`, 2, height);
            height += 30;
        } else {
            mainCtx.font = "30px Ubuntu";
            if (!settings.showPos || !isConnected) var pos = "";
            else {
                pos = `Position: (${~~cameraX}, ${~~cameraY})`;
                mainCtx.fillText(`${pos}`, 2, height);
                height += 30;
            }
        }
        mainCtx.font = "20px Ubuntu";
        var gameStatsText = `${~~stats.framesPerSecond} FPS`;
        if (!isNaN(stats.latency)) gameStatsText += ` | ${stats.latency}ms ping`;
        mainCtx.fillText(gameStatsText, 2, height);
        height += 24;
        if (stats.visible) mainCtx.drawImage(stats.canvas, 2, height);
        if (leaderboard.visible) mainCtx.drawImage(leaderboard.canvas, mainCanvas.width / viewMult - 10 - leaderboard.canvas.width, 10);
        if (!settings.hideChat && (isTyping || 1)) {
            mainCtx.globalAlpha = isTyping ? 1 : Math.max(1000 - syncAppStamp + chat.waitUntil, 0) / 1000;
            mainCtx.drawImage(chat.canvas, 10 / viewMult, (mainCanvas.height - 55) / viewMult - chat.canvas.height);
            mainCtx.globalAlpha = 1;
        }
        drawMinimap();
        mainCtx.restore();
        cacheCleanup();
        wHandle.requestAnimationFrame(drawGame);
    }
    function cellSort(a, b) {
        return a.s === b.s ? a.id - b.id : a.s - b.s;
    }
    function cameraUpdate() {
        var myCells = [];
        for (var i = 0; i < cells.mine.length; i++)
            if (cells.byId.hasOwnProperty(cells.mine[i]))
                myCells.push(cells.byId[cells.mine[i]]);
        if (myCells.length > 0) {
            var x = 0,
                y = 0,
                s = 0,
                score = 0;
            for (var i = 0, l = myCells.length; i < l; i++) {
                var cell = myCells[i];
                score += ~~(cell.ns * cell.ns / 100);
                x += cell.x;
                y += cell.y;
                s += cell.s;
            }
            targetX = x / l;
            targetY = y / l;
            targetZ = Math.pow(Math.min(64 / s, 1), .4);
            cameraX += (targetX - cameraX) / 2;
            cameraY += (targetY - cameraY) / 2;
            stats.score = score;
            stats.maxScore = Math.max(stats.maxScore, score);
        } else {
            stats.score = NaN;
            stats.maxScore = 0;
            cameraX += (targetX - cameraX) / 20;
            cameraY += (targetY - cameraY) / 20;
        }
        cameraZ += (targetZ * viewMult * mouseZ - cameraZ) / 9;
        cameraZInvd = 1 / cameraZ;
    }
    function Cell(id, x, y, s, name, color, skin, flags) {
        this.id = id;
        this.x = this.nx = this.ox = x;
        this.y = this.ny = this.oy = y;
        this.s = this.ns = this.os = s;
        this.setColor(color);
        this.setName(name);
        this.setSkin(skin);
        this.jagged = flags & 0x01 || flags & 0x10;
        this.ejected = !!(flags & 0x20);
        this.food = !!(flags & 0x80); // For my server
        this.born = syncUpdStamp;
    }
    Cell.prototype = {
        destroyed: 0,
        id: 0, diedBy: 0,
        ox: 0, x: 0, nx: 0,
        oy: 0, y: 0, ny: 0,
        os: 0, s: 0, ns: 0,
        nameSize: 0, drawNameSize: 0,
        color: "#FFF", sColor: "#E5E5E5",
        skin: null, jagged: 0,
        born: null, updated: null, dead: null, // timestamps
        destroy: function(killerId) {
            delete cells.byId[this.id];
            if (cells.mine.remove(this.id) && cells.mine.length === 0) showOverlay();
            this.destroyed = 1;
            this.dead = syncUpdStamp;
            if (killerId && !this.diedBy) this.diedBy = killerId;
        },
        update: function(relativeTime) {
            var dt = (relativeTime - this.updated) / 120;
            dt = Math.max(Math.min(dt, 1), 0);
            if (this.destroyed && Date.now() > this.dead + 200) cells.list.remove(this);
            else if (this.diedBy && cells.byId.hasOwnProperty(this.diedBy)) {
                this.nx = cells.byId[this.diedBy].x;
                this.ny = cells.byId[this.diedBy].y;
            }
            this.x = this.ox + (this.nx - this.ox) * dt;
            this.y = this.oy + (this.ny - this.oy) * dt;
            this.s = this.os + (this.ns - this.os) * dt;
            this.nameSize = ~~(~~(Math.max(~~(.3 * this.ns), 24)) / 3) * 3;
            this.drawNameSize = ~~(~~(Math.max(~~(.3 * this.s), 24)) / 3) * 3;
        },
        setName: function(value) {
            var nameSkin = /\{([\w\W]+)\}/.exec(value);
            if (this.skin === null && nameSkin !== null) {
                this.name = value.replace(nameSkin[0], "").trim();
                this.setSkin(nameSkin[1]);
            } else this.name = value;
        },
        setSkin: function(value) {
            this.skin = (value && value[0] === "%" ? value.slice(1) : value) || this.skin;
            if (this.skin === null || !knownSkins.hasOwnProperty(this.skin) || loadedSkins[this.skin]) return;
            loadedSkins[this.skin] = new Image();
            loadedSkins[this.skin].src = `${SKIN_URL}${this.skin}.png`;
        },
        setColor: function(value) {
            if (!value) {return log.warn("Returned no color!")}
            this.color = value;
            this.sColor = darkenColor(value);
        },
        draw: function(ctx) {
            ctx.save();
            this.drawShape(ctx);
            this.drawText(ctx);
            ctx.restore();
        },
        drawShape: function(ctx) {
            if (settings.hideFood && this.food) return;
            ctx.fillStyle = settings.showColor ? this.color : Cell.prototype.color;
            var color = String($("#cellBorderColor").val());
            ctx.strokeStyle = (color === '000000' || color === '000' || !color) ?
                (settings.showColor ? this.sColor : Cell.prototype.sColor) : "#" + color;
            var size = String($("#cellBorderSize").val());
            ctx.lineWidth = (this.jagged) ? 12 : ((!size || size > 50) ? Math.max(~~(this.s / 50), 10) : size);
            var showCellBorder = settings.cellBorders && !this.food && !this.ejected && 20 < this.s;
            if (showCellBorder) this.s -= ctx.lineWidth / 2 - 2;
            ctx.beginPath();
            if (this.jagged) {
                var points = this.s;
                var increment = Math.PI * 2 / points;
                ctx.moveTo(this.x, this.y + this.s + 3);
                for (var i = 1; i < points; i++) {
                    var angle = i * increment;
                    var dist = this.s - 3 + (i % 2 === 0) * 6;
                    ctx.lineTo(this.x + dist * Math.sin(angle), this.y + dist * Math.cos(angle));
                }
                ctx.lineTo(this.x, this.y + this.s + 3);
            } else ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2, 0);
            ctx.closePath();
            if (settings.transparency) ctx.globalAlpha = .75;
            else if (this.destroyed) ctx.globalAlpha = Math.max(200 - Date.now() + this.dead, 0) / 100;
            else ctx.globalAlpha = Math.min(Date.now() - this.born, 200) / 100;
            if (showCellBorder) ctx.stroke();
            ctx.fill();
            if (settings.showSkins && this.skin) {
                var skin = loadedSkins[this.skin];
                if (skin && skin.complete && skin.width && skin.height) {
                    ctx.save();
                    ctx.clip();
                    scaleBack(ctx);
                    var sScaled = this.s * cameraZ;
                    ctx.drawImage(skin, this.x * cameraZ - sScaled, this.y * cameraZ - sScaled, sScaled *= 2, sScaled);
                    scaleForth(ctx);
                    ctx.restore();
                }
            }
            if (showCellBorder) this.s += ctx.lineWidth / 2 - 2;
        },
        drawText: function(ctx) {
            if (this.s < 20 || this.jagged) return;
            if (settings.showMass && (cells.mine.indexOf(this.id) !== -1 || cells.mine.length === 0)) {
                var mass = (~~(this.s * this.s / 100)).toString();
                if (this.name && settings.showNames) {
                    drawText(ctx, 0, this.x, this.y, this.nameSize, this.drawNameSize, this.name);
                    var y = this.y + Math.max(this.s / 4.5, this.nameSize / 1.5);
                    drawText(ctx, 1, this.x, y, this.nameSize / 2, this.drawNameSize / 2, mass);
                } else drawText(ctx, 1, this.x, this.y, this.nameSize / 2, this.drawNameSize / 2, mass);
            } else if (this.name && settings.showNames) drawText(ctx, 0, this.x, this.y, this.nameSize, this.drawNameSize, this.name);
        }
    };
    function cacheCleanup() {
        for (var i in cachedNames) {
            for (var j in cachedNames[i])
                if (syncAppStamp - cachedNames[i][j].accessTime >= 5000) delete cachedNames[i][j];
            if (cachedNames[i] === {}) delete cachedNames[i];
        }
        for (var i in cachedMass)
            if (syncAppStamp - cachedMass[i].accessTime >= 5000) delete cachedMass[i];
    }
    // 2-var draw-stay cache
    var cachedNames = {};
    var cachedMass  = {};
    function drawTextOnto(canvas, ctx, text, size) {
        ctx.font = `${size}px Ubuntu`;
        ctx.lineWidth = settings.showTextOutline ? Math.max(~~(size / 10), 2) : 2;
        canvas.width = ctx.measureText(text).width + 2 * ctx.lineWidth;
        canvas.height = 4 * size;
        ctx.font = `${size}px Ubuntu`;
        ctx.lineWidth = settings.showTextOutline ? Math.max(~~(size / 10), 2) : 2;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        var string = String($("#nameColor").val());
        var color = "FFF";
        if (text === 'Ɦﻉɭɭƈคፕ (ʞ)') color = "F00";
        else if (text === 'Miwol') color = "F0F";
        ctx.fillStyle = "#" + (!string ? (color) : string);
        ctx.strokeStyle = "#000";
        ctx.translate(canvas.width / 2, 2 * size);
        (ctx.lineWidth !== 1) && ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
    }
    function drawRaw(ctx, x, y, text, size) {
        ctx.font = `${size}px Ubuntu`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = settings.showTextOutline ? Math.max(~~(size / 10), 2) : 2;
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        (ctx.lineWidth !== 1) && ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    function newNameCache(value, size) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        drawTextOnto(canvas, ctx, value, size);
        cachedNames[value] = cachedNames[value] || {};
        cachedNames[value][size] = {
            width: canvas.width,
            height: canvas.height,
            canvas: canvas,
            value: value,
            size: size,
            accessTime: syncAppStamp
        };
        return cachedNames[value][size];
    }
    function newMassCache(size) {
        var canvases = {
            "0": {}, "1": {}, "2": {}, "3": {}, "4": {},
            "5": {}, "6": {}, "7": {}, "8": {}, "9": {}
        };
        for (var value in canvases) {
            var canvas = canvases[value].canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            drawTextOnto(canvas, ctx, value, size);
            canvases[value].canvas = canvas;
            canvases[value].width = canvas.width;
            canvases[value].height = canvas.height;
        }
        cachedMass[size] = {
            canvases: canvases,
            size: size,
            lineWidth: settings.showTextOutline ? Math.max(~~(size / 10), 2) : 2,
            accessTime: syncAppStamp
        };
        return cachedMass[size];
    }
    function toleranceTest(a, b, tolerance) {
        return (a - tolerance) <= b && b <= (a + tolerance);
    }
    function getNameCache(value, size) {
        if (!cachedNames[value]) return newNameCache(value, size);
        var sizes = Object.keys(cachedNames[value]);
        for (var i = 0, l = sizes.length; i < l; i++)
            if (toleranceTest(size, sizes[i], size / 4)) return cachedNames[value][sizes[i]];
        return newNameCache(value, size);
    }
    function getMassCache(size) {
        var sizes = Object.keys(cachedMass);
        for (var i = 0, l = sizes.length; i < l; i++)
            if (toleranceTest(size, sizes[i], size / 4)) return cachedMass[sizes[i]];
        return newMassCache(size);
    }
    function drawText(ctx, isMass, x, y, size, drawSize, value) {
        ctx.save();
        if (size > 500) return drawRaw(ctx, x, y, value, drawSize);
        ctx.imageSmoothingQuality = "high";
        if (isMass) {
            var cache = getMassCache(size);
            cache.accessTime = syncAppStamp;
            var canvases = cache.canvases;
            var correctionScale = drawSize / cache.size;
            // calculate width
            var width = 0;
            for (var i = 0; i < value.length; i++) width += canvases[value[i]].width - 2 * cache.lineWidth;
            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            x -= width / 2;
            for (var i = 0; i < value.length; i++) {
                var item = canvases[value[i]];
                ctx.drawImage(item.canvas, x, y - item.height / 2);
                x += item.width - 2 * cache.lineWidth;
            }
        } else {
            cache = getNameCache(value, size);
            cache.accessTime = syncAppStamp;
            var canvas = cache.canvas;
            correctionScale = drawSize / cache.size;
            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            ctx.drawImage(canvas, x - canvas.width / 2, y - canvas.height / 2);
        }
        ctx.restore();
    }
    function init() {
        mainCanvas = document.getElementById("canvas");
        mainCtx = mainCanvas.getContext("2d");
        chatBox = document.getElementById("chat_textbox");
        mainCanvas.focus();
        function handleScroll(event) {
            mouseZ *= Math.pow(.95, event.wheelDelta / -120 || event.detail || 0);
            settings.infiniteZoom || (1 > mouseZ && (mouseZ = 1));
            mouseZ > 4 / mouseZ && (mouseZ = 4 / mouseZ);
        }
        if (/firefox/i.test(navigator.userAgent)) document.addEventListener("DOMMouseScroll", handleScroll, 0);
        else document.body.onmousewheel = handleScroll;
        wHandle.onkeydown = function(event) {
            switch (event.keyCode) {
                case 13: // Enter
                    if (overlayShown) break;
                    if (settings.hideChat) break;
                    if (isTyping) {
                        chatBox.blur();
                        var chattxt = chatBox.value;
                        if (chattxt.length > 0) sendChat(chattxt);
                        chatBox.value = "";
                    } else chatBox.focus();
                    break;
                case 32: // Space
                    if (isTyping || overlayShown || pressed.space) break;
                    wsSend(UINT8[17]);
                    pressed.space = 1;
                    break;
                case 87: // W
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[21]);
                    pressed.w = 1;
                    break;
                case 81: // Q
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[18]);
                    pressed.q = 1;
                    break;
                case 69: // E
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[22]);
                    pressed.e = 1;
                    break;
                case 82: // R
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[23]);
                    pressed.r = 1;
                    break;
                case 84: // T
                    if (isTyping || overlayShown || pressed.t) break;
                    wsSend(UINT8[24]);
                    pressed.t = 1;
                    break;
                case 80: // P
                    if (isTyping || overlayShown || pressed.p) break;
                    wsSend(UINT8[25]);
                    pressed.p = 1;
                    break;
                case 79: // O
                    if (isTyping || overlayShown || pressed.o) break;
                    wsSend(UINT8[26]);
                    pressed.o = 1;
                    break;
                case 77: // M
                    if (isTyping || overlayShown || pressed.m) break;
                    wsSend(UINT8[27]);
                    pressed.m = 1;
                    break;
                case 73: // I
                    if (isTyping || overlayShown || pressed.i) break;
                    wsSend(UINT8[28]);
                    pressed.i = 1;
                    break;
                case 89: // Y
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[30]);
                    pressed.y = 1;
                    break;
                case 85: // U
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[31]);
                    pressed.u = 1;
                    break;
                case 75: // K
                    if (isTyping || overlayShown || pressed.k) break;
                    wsSend(UINT8[29]);
                    pressed.k = 1;
                    break;
                case 76: // L
                    if (isTyping || overlayShown || pressed.l) break;
                    wsSend(UINT8[33]);
                    pressed.l = 1;
                    break;
                case 72: // H
                    if (isTyping || overlayShown || pressed.h) break;
                    wsSend(UINT8[34]);
                    pressed.h = 1;
                    break;
                case 90: // Z
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[35]);
                    pressed.z = 1;
                    break;
                case 88: // X
                    if (isTyping || overlayShown || pressed.x) break;
                    wsSend(UINT8[36]);
                    pressed.x = 1;
                    break;
                case 83: // S
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[37]);
                    pressed.s = 1;
                    break;
                case 67: // C
                    if (isTyping || overlayShown || pressed.c) break;
                    wsSend(UINT8[38]);
                    pressed.c = 1;
                    break;
                case 71: // J
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[39]);
                    pressed.j = 1;
                    break;
                case 74: // G
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[40]);
                    pressed.g = 1;
                    break;
                case 66: // B
                    if (isTyping || overlayShown || pressed.b) break;
                    wsSend(UINT8[41]);
                    pressed.b = 1;
                    break;
                case 86: // V
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[42]);
                    pressed.v = 1;
                    break;
                case 78: // N
                    if (isTyping || overlayShown) break;
                    wsSend(UINT8[43]);
                    pressed.n = 1;
                    break;
                case 27: // Esc
                    if (pressed.esc) break;
                    overlayShown ? hideOverlay() : showOverlay();
                    pressed.esc = 1;
                    break;
            }
        };
        wHandle.onkeyup = function(event) {
            switch (event.keyCode) {
                case 32: pressed.space = 0; break; // Space
                case 87: pressed.w = 0; break; // W
                case 81: if (pressed.q) wsSend(UINT8[19]); pressed.q = 0; break; // Q
                case 69: pressed.e = 0; break; // E
                case 82: pressed.r = 0; break; // R
                case 84: pressed.t = 0; break; // T
                case 80: pressed.p = 0; break; // P
                case 79: pressed.o = 0; break; // O
                case 77: pressed.m = 0; break; // M
                case 73: pressed.i = 0; break; // I
                case 89: pressed.y = 0; break; // Y
                case 85: pressed.u = 0; break; // U
                case 75: pressed.k = 0; break; // K
                case 76: pressed.l = 0; break; // L
                case 72: pressed.h = 0; break; // H
                case 90: pressed.z = 0; break; // Z
                case 88: pressed.x = 0; break; // X
                case 83: pressed.s = 0; break; // S
                case 67: pressed.c = 0; break; // C
                case 74: pressed.g = 0; break; // G
                case 71: pressed.j = 0; break; // J
                case 66: pressed.b = 0; break; // B
                case 86: pressed.v = 0; break; // V
                case 78: pressed.n = 0; break; // N
                case 27: pressed.esc = 0; break; // Esc
            }
        };
        chatBox.onblur = function() {
            isTyping = 0;
            drawChat();
        };
        chatBox.onfocus = function() {
            isTyping = 1;
            drawChat();
        };
        mainCanvas.onmousemove = function(event) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        };
        setInterval(function() { // send mouse update
            sendMouseMove((mouseX - mainCanvas.width / 2) / cameraZ + cameraX, (mouseY - mainCanvas.height / 2) / cameraZ + cameraY);
        }, 60);
        wHandle.onresize = function() {
            var cW = mainCanvas.width = wHandle.innerWidth,
                cH = mainCanvas.height = wHandle.innerHeight;
            viewMult = Math.sqrt(Math.min(cH / 1080, cW / 1920));
        };
        wHandle.onresize();
        log.info(`Init completed in ${Date.now() - DATE}ms`);
        gameReset();
        showOverlay();
        if (settings.allowGETipSet && wHandle.location.search) {
            var div = /ip=([\w\W]+):([0-9]+)/.exec(wHandle.location.search.slice(1));
            if (div) wsInit(`${div[1]}:${div[2]}`);
        }
        window.requestAnimationFrame(drawGame);
    }
    wHandle.setServer = function(arg) {
        if (WS_URL === arg) return;
        wsInit(arg);
    };
    wHandle.setDarkTheme = function(arg) {
        settings.darkTheme = arg;
        drawStats();
    };
    wHandle.setShowMass = function(arg) {
        settings.showMass = arg;
    };
    wHandle.setSkins = function(arg) {
        settings.showSkins = arg;
    };
    wHandle.setColors = function(arg) {
        settings.showColor = !arg;
    };
    wHandle.setNames = function(arg) {
        settings.showNames = arg;
        drawLeaderboard();
    };
    wHandle.setChatHide = function(arg) {
        settings.hideChat = arg;
        settings.hideChat ? wjQuery('#chat_textbox').hide() : wjQuery('#chat_textbox').show();
    };
    wHandle.setMinimap = function(arg) {
        settings.showMinimap = !arg;
    };
    wHandle.setGrid = function(arg) {
        settings.hideGrid = arg;
    };
    wHandle.setCellBorder = function(arg) {
        settings.cellBorders = arg;
    };
    wHandle.setZoom = function(arg) {
        settings.infiniteZoom = arg;
    };
    wHandle.setTransparency = function(arg) {
        settings.transparency = arg;
    };
    wHandle.setMapBorders = function(arg) {
        settings.mapBorders = arg;
    };
    wHandle.setSectors = function(arg) {
        settings.sectors = arg;
    };
    wHandle.setCellPos = function(arg) {
        settings.showPos = arg;
    };
    wHandle.setTextOutline = function(arg) {
        settings.showTextOutline = arg;
    };
    wHandle.setFood = function(arg) {
        settings.hideFood = arg;
    };
    wHandle.spectate = function() {
        wsSend(UINT8[1]);
        stats.maxScore = 0;
        hideOverlay();
    };
    wHandle.play = function(arg) {
        sendPlay(arg);
        hideOverlay();
    };
    wHandle.onload = init;
})(window, window.jQuery);
