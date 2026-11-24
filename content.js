const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" viewBox="0 0 47 64" fill="none">
<g clip-path="url(#clip0_357_20)"><path d="M47 19.5H0V3C0 1.61929 1.11929 0.5 2.5 0.5H10.5C11.8807 0.5 13 1.61929 13 3V6C13 7.38071 14.1193 8.5 15.5 8.5C16.8807 8.5 18 7.38071 18 6V3C18 1.61929 19.1193 0.5 20.5 0.5H26.5C27.8807 0.5 29 1.61929 29 3V6C29 7.38071 30.1193 8.5 31.5 8.5C32.8807 8.5 34 7.38071 34 6V3C34 1.61929 35.1193 0.5 36.5 0.5H44.5C45.8807 0.5 47 1.61929 47 3V19.5Z" fill="white"/><path d="M2.5 63.5C1.11929 63.5 0 62.3807 0 61V60.5H47V61C47 62.3807 45.8807 63.5 44.5 63.5H2.5Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8 24.5H39.5L47 55.5H29.5C28.1193 55.5 27 54.3807 27 53V50C27 48.6193 25.8807 47.5 24.5 47.5H22.5C21.1193 47.5 20 48.6193 20 50V53C20 54.3807 18.8807 55.5 17.5 55.5H0L8 24.5ZM22.5 31.5C21.1193 31.5 20 32.6193 20 34V38C20 39.3807 21.1193 40.5 22.5 40.5H24.5C25.8807 40.5 27 39.3807 27 38V34C27 32.6193 25.8807 31.5 24.5 31.5H22.5Z" fill="white"/></g><defs><clipPath id="clip0_357_20"><rect width="47" height="63" fill="white" transform="translate(0 0.5)"/></clipPath></defs></svg>`

if (window.location.href.includes("chess.com") || window.location.href.includes("c4355.com")) {

    onElementAppear('.game-over-modal-shell-buttons', () => {
        const targetElement = document.querySelector('.game-over-modal-shell-buttons')
        if (targetElement) targetElement.appendChild(chessComUI())
    })

    onElementAppear('.modal-game-over-buttons-component', () => {
        const targetElement = document.querySelector('.modal-game-over-buttons-component')
        if (targetElement) targetElement.appendChild(chessComUI())
    })

    onElementAppear('.tab-review-action-buttons', () => {
        const targetElement = document.querySelector('.tab-review-action-buttons')
        if (targetElement) targetElement.appendChild(chessComUI())
    })

}

if (window.location.href.includes("lichess.org")) {
    const url = window.location.href
    if (!url.includes("/tv") && !url.includes("/study")) {
        onElementAppear('section.status', () => {
            setTimeout(() => {
                const targetElement = document.querySelector('.analyse__round-training')
                if (targetElement) targetElement.appendChild(arslanovUI("lichess.org"))
            }, 100)
        })
        onElementAppear('section.status', () => {
            setTimeout(() => {
                const targetElement = document.querySelector('.round__side')
                if (targetElement) targetElement.appendChild(arslanovUI("lichess.org"))
            }, 100)
        })
    }
}

if (window.location.hostname == "endgame.ai") {
    // endgame.ai is a SPA, so the finished game UI can appear many times without page reload

    // popup over the board after the game is over
    onEachElementAppear('.game-finished-container', (popup) => {
        if (popup.querySelector('#ArslanovEndgameUI')) return
        // actions are rendered a bit later than the popup, outside of them UI is not inside the popup card
        const actions = popup.querySelector('.game-actions')
        // between battle games there are no actions, only the timer of the next game
        const battleTimer = popup.querySelector('.battle-content .game-set-timer')
        // after the last battle game there is only the summary of the battle
        const battleSummary = popup.querySelector('.battle-content .end-game-set-summary')
        if (actions) actions.appendChild(endgameUI(actions))
        else if (battleTimer) battleTimer.before(endgameUI(battleTimer))
        else if (battleSummary) battleSummary.after(endgameUI(battleSummary))
    })

    // actions in the sidebar of the finished game
    onEachElementAppear('.finished-game-actions', (targetElement) => {
        if (!targetElement.querySelector('#ArslanovEndgameUI')) targetElement.appendChild(endgameUI(targetElement))
    })

    // sidebar of the bot game has no finished game actions, so add UI under the widgets when the board is finished
    onEachElementAppear('.widgets > .bot-header-panel', (panel) => {
        const widgets = panel.parentElement
        const ui = widgets.querySelector(':scope > #ArslanovEndgameUI')
        const finished = !!document.querySelector('.board.finished')
        if (finished && !ui) widgets.appendChild(endgameUI(widgets))
        // a new game can be started without page reload
        if (!finished && ui) ui.remove()
    })

    // expanded game card in the games history of a profile, under the game review button
    onEachElementAppear('.recent-game-card .expanded-game-content .game-review-button', (reviewButton) => {
        const card = reviewButton.closest('.recent-game-card')
        if (card.querySelector('#ArslanovEndgameUI')) return
        const ui = endgameUI(card)
        // the card collapses on click
        ui.addEventListener("click", (event) => event.stopPropagation())
        reviewButton.parentElement.after(ui)
    })

    // analysis page of a game, under the navigation toolbar of the right panel
    onEachElementAppear('.column-2.desktop-panel-position', (column) => {
        const panel = column.parentElement
        const ui = panel.querySelector(':scope > #ArslanovEndgameUI')
        const hasGame = !!getEndgameAnalyzeId()
        if (hasGame && !ui) panel.appendChild(endgameUI(panel))
        // free analysis without a game
        if (!hasGame && ui) ui.remove()
    })
}

// chess variants of endgame.ai that can be analyzed as regular chess
const ENDGAME_SUPPORTED_VARIANTS = ["Standard", "Blind"]
const ENDGAME_VARIANT_NAMES = { "Chess960": "Шахматы Фишера", "SecretQueen": "Тайный ферзь" }

// UI is hidden until the variant of the game is known, unsupported variants get a message instead of buttons
function endgameUI(targetElement) {
    const ui = arslanovUI("endgame.ai")
    ui.style.display = "none"
    getEndgameGame(findEndgameGameId(targetElement))
        .then(json => {
            const variant = json.variant || "Standard"
            if (!ENDGAME_SUPPORTED_VARIANTS.includes(variant)) {
                const message = document.createElement("div")
                message.className = "arslanov-unsupported"
                message.textContent = `Вариант «${ENDGAME_VARIANT_NAMES[variant] || variant}» не поддерживается`
                const buttonContainer = ui.querySelector(".buttons")
                buttonContainer.innerHTML = ""
                buttonContainer.appendChild(message)
            }
        })
        .catch(error => debuglog(error))
        .finally(() => ui.style.display = "")
    return ui
}

async function goToArslanovChess(site, color, buttonContainer) {
    let pgn
    if (site == "chess.com") pgn = await getCurrentPgn_chessCom()
    else if (site == "endgame.ai") pgn = await getCurrentPgn_endgame(findEndgameGameId(buttonContainer))
    else pgn = await getCurrentPgn_lichess()
    // only finished games can be analyzed
    if (/\[Result "\*"\]/.test(pgn)) throw new Error("the game is not finished")
    const encoded = encodeURIComponent(cleanPgn(pgn))
    window.open(`https://arslanovchess.com/games-analysis?autostart=true&color=${color}&pgn=${encoded}#title`)
    return pgn
}

function arslanovUI(site) {
    const svgContainer = document.createElement("div")
    svgContainer.classList.add("svg-container")
    svgContainer.innerHTML = svg

    const title = document.createElement("div")
    title.textContent = "Анализ на ArslanovChess"
    title.classList.add("title")
    title.appendChild(svgContainer)

    const buttonW = document.createElement("button")
    buttonW.textContent = "За белых"

    const buttonB = document.createElement("button")
    buttonB.textContent = "За чёрных"

    const buttonContainer = document.createElement("div")
    buttonContainer.classList.add("buttons")
    buttonContainer.appendChild(buttonW)
    buttonContainer.appendChild(buttonB)

    // Use a handler that swaps buttons with a loader while PGN is fetched
    buttonW.addEventListener('click', () => handleAnalyzeClick(site, 'w', buttonContainer))
    buttonB.addEventListener('click', () => handleAnalyzeClick(site, 'b', buttonContainer))

    const container = document.createElement("div")
    container.id = { "chess.com": "ArslanovChessComUI", "endgame.ai": "ArslanovEndgameUI" }[site] || "ArslanovLichessUI"
    container.appendChild(title)
    container.appendChild(buttonContainer)

    return container
}

function onElementAppear(selector, callback) {
    const targetNode = document.body
    const config = { childList: true, subtree: true }

    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const elements = document.querySelectorAll(selector)
                if (elements.length > 0) {
                    callback(elements)
                    observer.disconnect()
                    break
                }
            }
        }
    })

    observer.observe(targetNode, config)
}

// unlike onElementAppear, keeps observing and calls callback for every matching element
function onEachElementAppear(selector, callback) {
    const check = () => document.querySelectorAll(selector).forEach(element => callback(element))
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    check()
}

// Chess.com games are taken only from the official Published-Data API (https://www.chess.com/news/view/published-data-api),
// it contains only finished games. Internal chess.com endpoints are not used after the request of Chess.com, LLC.
const CHESSCOM_API = "https://api.chess.com/pub/player"
const CHESSCOM_OLD_ARCHIVES_LIMIT = 24

// url can be /game/<id>, /game/live/<id>, /game/daily/<id>, /analysis/game/live/<id>, /computer/<id> ...
function getChessComGameId() {
    const match = window.location.pathname.match(/\/(\d{5,})(?:\/|$)/)
    return match ? match[1] : null
}

// games with bots are not in the public API
function isChessComBotGame() {
    return /\/computer(\/|$)/.test(window.location.pathname)
}

function chessComUI() {
    if (!isChessComBotGame()) return arslanovUI("chess.com")
    const ui = arslanovUI("chess.com")
    const buttonContainer = ui.querySelector(".buttons")
    buttonContainer.innerHTML = ""
    const message = unsupportedMessage(
        "Партии с ботами не поддерживаются",
        "По требованию Chess.com расширение получает партии только через их официальный публичный API, а партий с ботами в нём нет."
    )
    message.appendChild(manualAnalysisHint())
    buttonContainer.appendChild(message)
    return ui
}

function unsupportedMessage(text, note) {
    const message = document.createElement("div")
    message.className = "arslanov-unsupported"
    message.textContent = text
    if (note) {
        const noteDiv = document.createElement("div")
        noteDiv.className = "arslanov-note"
        noteDiv.textContent = note
        message.appendChild(noteDiv)
    }
    return message
}

// usernames of the players shown on the page, the game is searched in their archives
function getChessComUsernames() {
    const names = []
    const add = (name) => {
        name = (name || "").trim().toLowerCase()
        if (/^[a-z0-9_-]{3,25}$/.test(name) && !names.includes(name)) names.push(name)
    }
    const selectors = [
        '[data-test-element="user-tagline-username"]',
        '.user-tagline-username',
        '.cc-user-username-component',
        '.user-username-component',
    ]
    selectors.forEach(selector => document.querySelectorAll(selector).forEach(element => add(element.textContent)))
    // profile links as the last resort, there can be many of them on the page
    document.querySelectorAll('a[href*="/member/"]').forEach(link => {
        const match = link.getAttribute("href").match(/\/member\/([A-Za-z0-9_-]+)/)
        if (match) add(match[1])
    })
    return names.slice(0, 6)
}

async function fetchChessComApi(url) {
    const response = await fetch(url, { cache: "no-store" })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`chess.com public API request failed: ${response.status}`)
    return response.json()
}

function chessComArchiveUrl(username, monthsAgo) {
    const now = new Date()
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1))
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    return `${CHESSCOM_API}/${username}/games/${date.getUTCFullYear()}/${month}`
}

async function findChessComGameInArchives(archiveUrls, gameId) {
    for (const url of archiveUrls) {
        const archive = await fetchChessComApi(url)
        const game = ((archive && archive.games) || []).find(game => game.url && game.url.endsWith(`/${gameId}`))
        if (game) return game
    }
    return null
}

// the game is in the archive of the month when it ended (UTC), so check the current and the previous month
function findRecentChessComGame(username, gameId) {
    return findChessComGameInArchives([0, 1].map(monthsAgo => chessComArchiveUrl(username, monthsAgo)), gameId)
}

async function findOldChessComGame(username, gameId) {
    const list = await fetchChessComApi(`${CHESSCOM_API}/${username}/games/archives`)
    const recent = [0, 1].map(monthsAgo => chessComArchiveUrl(username, monthsAgo))
    const old = ((list && list.archives) || [])
        .filter(url => !recent.includes(url))
        .reverse()
        .slice(0, CHESSCOM_OLD_ARCHIVES_LIMIT)
    return findChessComGameInArchives(old, gameId)
}

async function getCurrentPgn_chessCom() {
    debuglog("getCurrentPgn_chessCom")
    if (isChessComBotGame()) throw new Error("games with bots are not in the chess.com public API")
    const gameId = getChessComGameId()
    if (!gameId) throw new Error("chess.com game id not found")
    const usernames = getChessComUsernames()
    if (!usernames.length) throw new Error("chess.com usernames not found")

    for (const username of usernames) {
        const game = await findRecentChessComGame(username, gameId)
        if (game) return game.pgn
    }
    for (const username of usernames) {
        const game = await findOldChessComGame(username, gameId)
        if (game) return game.pgn
    }
    // a game that has just ended can appear in the archive with a small delay
    for (let attempt = 0; attempt < 2; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        for (const username of usernames) {
            const game = await findRecentChessComGame(username, gameId)
            if (game) return game.pgn
        }
    }
    throw new Error("chess.com game not found in the public API")
}

function getCurrentPgn_lichess() {
    debuglog("getCurrentPgn_lichess")
    // get game id
    // url can be lichess.org/<id> or lichess.org/game/<id> (id may be 12 chars with player suffix)
    const pathParts = window.location.pathname.split("/").filter(part => part && part !== "game")
    const gameId = (pathParts.find(part => /^[a-zA-Z0-9]{8,12}$/.test(part)) || "").slice(0, 8)
    // get game pgn
    return new Promise((resolve, reject) => {
        if (!gameId) return reject(new Error("lichess game id not found"))
        fetch(`https://lichess.org/game/export/${gameId}?evals=false&clocks=false&opening=false`)
            .then(response => response.ok ? response.text() : Promise.reject(new Error(`lichess export failed: ${response.status}`)))
            .then(data => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

// the board has id "board-<gameId>", the url has no game id in battles and simuls (and there can be many boards)
function findEndgameGameId(element) {
    // game card in the games history
    const card = element.closest('[data-game-id]')
    if (card) return card.dataset.gameId
    // the board of the analysis page has a random id
    const analyzeId = getEndgameAnalyzeId()
    if (analyzeId) return analyzeId
    for (let parent = element; parent; parent = parent.parentElement) {
        const board = parent.closest('[id^="board-"]') || parent.querySelector('[id^="board-"]')
        if (board) return board.id.slice("board-".length)
    }
    // url can be endgame.ai/game/<id> or endgame.ai/bot-game/<id>
    const match = window.location.pathname.match(/\/(?:bot-)?game\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
}

// url endgame.ai/analyze/<id>, id is "imp_<id>" for an imported game (game review of any game is imported)
function getEndgameAnalyzeId() {
    const match = window.location.pathname.match(/\/analyze\/([a-zA-Z0-9_]+)/)
    return match ? match[1] : null
}

async function getEndgameGame(gameId) {
    if (!gameId) throw new Error("endgame game id not found")
    const endpoint = gameId.startsWith("imp_") ? "imported-games" : "games"
    const response = await fetch(`https://endgame.ai/api/${endpoint}/${gameId}`)
    if (!response.ok) throw new Error(`endgame game request failed: ${response.status}`)
    return response.json()
}

async function getCurrentPgn_endgame(gameId) {
    debuglog("getCurrentPgn_endgame")
    const json = await getEndgameGame(gameId)
    if (!ENDGAME_SUPPORTED_VARIANTS.includes(json.variant || "Standard")) throw new Error(`endgame variant ${json.variant} is not supported`)
    return endgameJsonToPgn(json)
}

function endgameJsonToPgn(json) {
    const chess = new Chess(json.startingFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

    const white = json.players.find(player => player.color == "w") || {}
    const black = json.players.find(player => player.color == "b") || {}
    chess.header("White", white.username || "White")
    chess.header("Black", black.username || "Black")
    if (white.rating) chess.header("WhiteElo", Math.round(white.rating).toString())
    if (black.rating) chess.header("BlackElo", Math.round(black.rating).toString())

    // each move is a query string like "n=1&p=pw&cf=e2&ct=e4&ti=&pgn=e4&fen=..."
    json.moves.forEach(query => {
        const params = {}
        query.split("&").forEach(pair => {
            const index = pair.indexOf("=")
            params[pair.slice(0, index)] = decodeURIComponent(pair.slice(index + 1))
        })
        const promotion = params.ti ? params.ti[0].toLowerCase() : undefined
        const move = chess.move({ from: params.cf, to: params.ct, promotion }) || chess.move(params.pgn)
        if (!move) throw new Error(`endgame move parse failed: ${query}`)
    })
    debuglog(chess.pgn())
    return chess.pgn()
}

function cleanPgn(pgn) {
    pgn = pgn.trim()

    const header_regex = /^\s*\[.*\]\s*$/gm
    const comments_regex = /\{[^}]*\}|\;[^\r\n]*/g
    const variations_regex = /(\([^()]+\))+?/g
    const annotation_glyphs_regex = /\$\d+/g

    const tags = pgn.match(header_regex) || []
    const filteredTags = tags.filter((tag) => {
        const legalTagNames = ["Event ", "White ", "Black ", "WhiteElo ", "BlackElo ", "FEN "]
        return legalTagNames.some((tagName) => tag.includes(tagName))
    })

    const moves = pgn
        .replace(header_regex, '')
        .replace(comments_regex, '')
        .replace(variations_regex, '')
        .replace(annotation_glyphs_regex, '')
        // black move numbers like "1... d5" are left after clock comments are removed
        .replace(/\d+\.\.\./g, '')
        .replace(/\s+/g, ' ')

    const result = filteredTags.join('\n') + '\n\n' + moves
    return result.trim()
}

function debuglog(message) {
    const logDebugMessages = false
    if (logDebugMessages) console.log(message)
}

// Loader and error UI helpers
function createLoader() {
    const wrapper = document.createElement('div')
    wrapper.className = 'arslanov-loader'
    const spinner = document.createElement('div')
    spinner.className = 'arslanov-spinner'
    const text = document.createElement('span')
    text.className = 'arslanov-loader-text'
    text.textContent = 'Загрузка PGN...'
    wrapper.appendChild(spinner)
    wrapper.appendChild(text)
    return wrapper
}

const MANUAL_ANALYSIS_URL = "https://arslanovchess.com/games-analysis"

// when the extension can't get the game, the user can always copy the PGN and paste it into the analysis manually
function manualAnalysisHint() {
    const hint = document.createElement('div')
    hint.className = 'arslanov-manual-hint'
    hint.appendChild(document.createTextNode('Вы всегда можете скопировать PGN партии и вставить его в '))
    const link = document.createElement('a')
    link.href = MANUAL_ANALYSIS_URL
    link.target = '_blank'
    link.rel = 'noopener'
    link.textContent = 'анализ вручную'
    // the card of endgame.ai games history collapses on click
    link.addEventListener('click', (event) => event.stopPropagation())
    hint.appendChild(link)
    hint.appendChild(document.createTextNode('.'))
    return hint
}

function showError(container, message, withManualHint = true) {
    container.innerHTML = ''
    const errorDiv = document.createElement('div')
    errorDiv.className = 'arslanov-error'
    const text = document.createElement('div')
    text.innerHTML = message
    errorDiv.appendChild(text)
    if (withManualHint) errorDiv.appendChild(manualAnalysisHint())
    container.appendChild(errorDiv)
}

function handleAnalyzeClick(site, color, buttonContainer) {
    if (buttonContainer.dataset.loading === 'true') return
    const originalButtons = Array.from(buttonContainer.children).map(n => n.cloneNode(true))
    buttonContainer.dataset.loading = 'true'
    buttonContainer.innerHTML = ''
    buttonContainer.appendChild(createLoader())

    goToArslanovChess(site, color, buttonContainer)
        .then(() => {
            // success: restore original buttons
            buttonContainer.innerHTML = ''
            originalButtons.forEach(btn => buttonContainer.appendChild(btn))
            // re-wire events after clone
            const [btnW, btnB] = buttonContainer.children
            if (btnW) btnW.addEventListener('click', () => handleAnalyzeClick(site, 'w', buttonContainer))
            if (btnB) btnB.addEventListener('click', () => handleAnalyzeClick(site, 'b', buttonContainer))
        })
        .catch(err => {
            console.error('Ошибка получения PGN', err)
            const notFinished = err && err.message === "the game is not finished"
            const message = notFinished
                ? 'Партия ещё не закончена. <br> Анализ доступен только после окончания партии.'
                : site == "chess.com"
                    ? 'Партия не найдена в публичном API Chess.com. <br> Если партия только что закончилась, попробуйте через минуту.'
                    : 'Ошибка получения PGN. <br> Попробуйте через архив партий.'
            // unfinished games are rejected on purpose, so there is nothing to paste manually
            showError(buttonContainer, message, !notFinished)
            setTimeout(() => {
                buttonContainer.innerHTML = ''
                originalButtons.forEach(btn => buttonContainer.appendChild(btn))
                const [btnW, btnB] = buttonContainer.children
                if (btnW) btnW.addEventListener('click', () => handleAnalyzeClick(site, 'w', buttonContainer))
                if (btnB) btnB.addEventListener('click', () => handleAnalyzeClick(site, 'b', buttonContainer))
            }, 12000)
        })
        .finally(() => {
            delete buttonContainer.dataset.loading
        })
}
