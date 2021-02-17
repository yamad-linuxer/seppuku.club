;(async () => {
    const articleBox = document.getElementById('articleBox')
    const rightBlock = document.getElementById('rightBlock')
    const url = new URL(document.location)
    const params = new URLSearchParams(url.search.slice(1))

    const fetchText = async url => {
        try {
            const res = await fetch(url)
            return res.text()
        } catch {
            return null
        }
    }
    const setParam = (key, value) => {
        params.set(key, value)
        document.location.href = url.toString().replace(url.search, '') + '?' + params
    }
    const genDateStr = date => new Date(date).toLocaleString('ja')
    const cGetStrCache = storage => async (name, asyncGetValFunc) => {
        const cached = storage.getItem(name)
        if (cached) {
            return cached
        } else {
            const str = await asyncGetValFunc()
            storage.setItem(name, str)
            return str
        }
    }
    const genArticle = (md, date, bottomMd) => {
        const element = document.createElement('article')
        element.classList.add('paper')
        element.innerHTML = `
          <div class="articleInfo">
            <span>${
                date
                    ? date.post
                        ? `投稿: ${ genDateStr(date.post) }`
                        : date.updated
                        ? ''
                        : '🌐'
                    : '🌐'
            }</span>
            <span>${
                date
                    ? date.updated
                        ? `更新: ${ genDateStr(date.updated) }`
                        : ''
                    : ''
            }</span>
          </div>
          <hr class="articleHr">
          <div class="articleBody">${ window.marked.parse(md) }</div>
        `
        return element
    }

    const getStrCache = cGetStrCache(window.sessionStorage)
    const pages = JSON.parse(await getStrCache('pages', async () => await fetchText('js/pages.json')))
    const rBlocks = JSON.parse(await getStrCache('rblocks', async () => await fetchText('js/rblocks.json')))
    const articles = Object.keys(pages).filter(key => !pages.ignore.includes(key))
    const rBlockKeys = Object.keys(rBlocks)

    const renderRightBlock = async () => {
        for (let i = 0; i < rBlockKeys.length; i++) {
            const { file } = rBlocks[rBlockKeys[i]]
            const md = await getStrCache(`rb${ rBlockKeys[i] }`, async () => await fetchText(file))
            const element = document.createElement('div')
            element.classList.add('paper')
            element.innerHTML = window.marked.parse(md)
            rightBlock.appendChild(element)
        }
    }

    if (params.has('p')) {
        const pageId = params.get('p')
        if (Object.keys(pages).includes(pageId)) {
            renderRightBlock()
            const { date, file } = pages[pageId]
            const md = await getStrCache(`p${ pageId }`, async () => await fetchText(file))
            articleBox.appendChild(genArticle(md, date))
        } else {
            params.set('p', '404')
            document.location.replace(url.toString().replace(url.search, '') + '?' + params)
        }
    } else {
        renderRightBlock()
        // ページ切り替えとか実装したい
        for (let i = articles.length - 1; i >= 0; i--) {
            const { date, file } = pages[articles[i]]
            const md = (await getStrCache(`p${ articles[i] }`, async () => await fetchText(file))).replace(/\n+/g, '\n')
            const element = genArticle(
                md.length < 85 ? md : md.substr(0, 84) + ' ……(続く)',
                date.updated ? { updated: date.updated } : { post: date.post }
            )
            element.classList.add('noSelect')
            element.addEventListener('click', () => setParam('p', articles[i]))
            articleBox.appendChild(element)
        }
    }
})()