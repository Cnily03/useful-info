! function () {
    const MAIN_TITLE = "Useful Info"

    // const $ = document.querySelector
    const $ = t => document.querySelector(t)
    const setCSSVariable = (key, value) => document.querySelector(":root").style.setProperty(key, value)
    const formatId = id => id.replace(/[# \/\\]/g, "").replace(/[\.\[\]\?]/g, "_")
    const openTarget = target => {
        var ea = document.createElement("a")
        ea.href = "#" + target
        ea.click()
    }
    const openURL = url => {
        var ea = document.createElement("a")
        ea.href = url
        ea.click()
    }
    const setClipBoard = (text) => {
        const copyReact = (e) => {
            e.clipboardData.setData("text/plain", text);
            e.preventDefault();
        }
        let success = false;
        document.addEventListener("copy", copyReact)
        try {
            document.execCommand("copy");
            success = true
        } catch (e) {
            prompt("你的浏览器不支持复制，请手动复制", text);
            success = false
        }
        document.removeEventListener("copy", copyReact)
        return success
    }

    // set page title
    const TITLE = STORAGE.TITLE || "Page"
    document.title = TITLE + " | " + MAIN_TITLE

    // render content
    var urlTargetedVisit = false
    const URI_ID = decodeURI((/#(.+)$/.exec(window.location.href) || [])[1] || "").split("/")

    var CUSTOM_CSS = []

    function renderContent(id = URI_ID[0]) {
        id = id || $(".nav-container").firstChild.id.slice(2)
        const eContent = $(".content")
        // clear current status
        eContent.innerHTML = ""
        while (CUSTOM_CSS.length) document.styleSheets[0].deleteRule(CUSTOM_CSS.pop())
        // find the target content
        var content = STORAGE.FUNC.filter(o => o["navid"] == id)[0].content
        // format to std
        if (typeof content[0] !== "object")
            content = [{
                title: undefined,
                header: undefined,
                headerLayout: undefined,
                detail: content
            }]
        // start rendering content
        for (let i = 0; i < content.length; i++) {
            const o = content[i]
            // get the max length of content[].detail
            const maxlen = (() => {
                let _maxlen = 0
                o.detail = o.detail.map(v => Array.isArray(v) ? v : new Array(v))
                o.detail.forEach(v => _maxlen = v.length > _maxlen ? v.length : _maxlen)
                return _maxlen
            })()

            const ePiece = document.createElement("div")
            ePiece.classList.add("piece")

            if (o.title) {
                var ePTitle = document.createElement("div")
                ePTitle.classList.add("p-title")
                ePTitle.id = "s_" + formatId(o.title)
                ePTitle.innerHTML = o.title
                ePiece.appendChild(ePTitle)
                // title click event
                ePTitle.addEventListener("click", e => {
                    openTarget(document.querySelector(".nav-container .nav.active").id.slice(2) + "/" + e.target.id.slice(2))
                    window.scrollTo({
                        behavior: "smooth",
                        top: e.target.offsetTop
                    })
                    // e.target.scrollIntoView()
                })
            }

            const ePDetail = document.createElement("div")
            ePDetail.classList.add("p-detail")

            ePiece.appendChild(ePDetail)
            eContent.appendChild(ePiece)

            // calculate css (grid-template-columns)
            var maxColumnWidth = Array.from({
                length: maxlen
            }, () => 0)
            // render a line
            function genLine(arr, ...otherClass) {
                // expand the arr to maxlen
                if (!otherClass.includes("detail-header")) {
                    var loop = maxlen - arr.length < 0 ? 0 : (maxlen - arr.length)
                    while (loop--) arr.push("")
                }

                let titled = false
                for (let i = 0; i < arr.length; i++) {
                    const str = arr[i]
                    const eDiv = document.createElement("div")
                    eDiv.classList.add(...otherClass)
                    if (arr.length > 1 && !titled) eDiv.classList.add("detail-title"), titled = true
                    else eDiv.classList.add("detail-content")
                    eDiv.innerHTML = str

                    ePDetail.appendChild(eDiv)

                    eDiv.style.width = "max-content"
                    maxColumnWidth[i] = eDiv.clientWidth > maxColumnWidth[i] ? eDiv.clientWidth : maxColumnWidth[i]
                    eDiv.removeAttribute("style")
                }
            }

            if (o.header) genLine(o.header, "detail-header")
            o.detail.forEach(s => genLine(s))

            // set css
            let totalWidth = eval(maxColumnWidth.join("+"))
            let gridTemplateColumns = ""
            for (let j = 0; j < maxlen; j++) gridTemplateColumns += maxColumnWidth[j] / totalWidth * 100 + "% "
            CUSTOM_CSS.push(document.styleSheets[0].insertRule(
                maxlen > 1 ?
                `.content .piece:nth-child(${i+1}) .p-detail {width: ${totalWidth+maxlen*2}px; grid-template-columns: ${gridTemplateColumns}}` :
                `.content .piece:nth-child(${i+1}) .p-detail {width: max-content; max-width: min(100%,${maxColumnWidth[0]*5+maxlen*2}px); grid-template-columns: repeat(auto-fit,${maxColumnWidth[0]}px)}`
            ))
            if (o.headerLayout) {
                var startLine = 1,
                    layoutArgs = o.headerLayout.trim().split(" ").map(Number)
                for (let j = 0; j < layoutArgs.length; j++) {
                    let endLine = startLine + layoutArgs[j]
                    CUSTOM_CSS.push(document.styleSheets[0].insertRule(
                        `.content .piece:nth-child(${i+1}) .p-detail > div.detail-header:nth-child(${j+1}) {grid-column: ${startLine} / ${endLine}}`
                    ))
                    startLine = endLine
                }
            }
        }

    }

    document.addEventListener("DOMContentLoaded", e => {
        // set title
        $(".title").innerHTML = TITLE
        $(".title").addEventListener("click", e => openURL(window.location.origin + window.location.pathname))

        const eNavContainer = $(".nav-container")
        let maxNavWidth = 0
        for (const func of STORAGE.FUNC) {
            // render nav
            var navNode = document.createElement("div")
            navNode.classList.add("nav")
            navNode.id = "s_" + formatId(func.nav)
            func["navid"] = formatId(func.nav)
            navNode.innerHTML = func.nav
            eNavContainer.appendChild(navNode)

            navNode.style.width = "max-content"
            maxNavWidth = navNode.clientWidth > maxNavWidth ? navNode.clientWidth : maxNavWidth
            navNode.removeAttribute("style")

            // nav click event
            navNode.addEventListener("click", e => {
                document.querySelectorAll(".nav-container .nav").forEach(e => e.classList.remove("active"))
                e.target.classList.add("active")
                if (!urlTargetedVisit) openTarget(e.target.id.slice(2))
                renderContent(e.target.id.slice(2))
                // copy click
                document.querySelectorAll(".content .piece .p-detail > div:not(.detail-header)").forEach(s => {
                    let canCopy = true
                    s.addEventListener("click", e => {
                        if (!canCopy) return
                        let after_width = parseFloat(window.getComputedStyle(e.target, ":after").width)
                        if (e.offsetX > e.target.offsetWidth - after_width) {
                            const success = setClipBoard(s.innerHTML)
                            if (success) {
                                canCopy = false
                                e.target.classList.add("copied")
                                setTimeout(() => {
                                    canCopy = true
                                    e.target.classList.remove("copied")
                                }, 1000)
                            }
                        }
                    })
                })

                // URL Target Visit
                setTimeout(() => {
                    if (urlTargetedVisit && $("#s_" + URI_ID[1])) $("#s_" + URI_ID[1]).click()
                    if (urlTargetedVisit) urlTargetedVisit = false
                }, 250)
            })
        }

        // set grid columns (nav)
        function setNavGridColums() {
            if (maxNavWidth * STORAGE.FUNC.length <= eNavContainer.clientWidth) setCSSVariable("--nav-columns", STORAGE.FUNC.length)
            else setCSSVariable("--nav-columns", 1)
        }
        window.addEventListener("resize", setNavGridColums), setNavGridColums()
    })

    // render content
    document.addEventListener("DOMContentLoaded", e => {
        try {
            urlTargetedVisit = true
            $("#s_" + URI_ID[0]).click()
        } catch (e) {
            renderContent()
        }
    })
}()