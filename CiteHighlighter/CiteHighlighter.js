//<nowiki>

class CiteHighlighter {
	/** CAREFUL. This is case sensitive. */
	deleteAll(haystack, ...strings) {
		for ( let string of strings ) {
			for ( let key in haystack ) {
				haystack[key] = this.deleteFromArray(haystack[key], string);
			}
		}
	}

	deleteFromArray(haystack, needle) {
		const index = haystack.indexOf(needle);
		if (index > -1) {
			haystack.splice(index, 1);
		}
		return haystack;
	}
	
	async getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		title = encodeURIComponent(title);
		await $.ajax({
			url: '/w/api.php?action=parse&page='+title+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
			async: false
		});
		return wikicode;
	}

	async getWikitextFromCache(title) {
		var api = new mw.ForeignApi('https://en.wikipedia.org/w/api.php');
		var wikitext = '';
		await api.get( {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvslots: '*',
			rvprop: 'content',
			formatversion: '2',
			uselang: 'content', // needed for caching
			smaxage: '86400', // cache for 1 day
			maxage: '86400' // cache for 1 day
		} ).done( function ( data ) {
			wikitext = data.query.pages[0].revisions[0].slots.main.content;
		} );
		return wikitext;
	}

	/** Observe and highlight popups created by the gadget Reference Tooltips. */
	observeAndAddClassesToTooltips() {
		new MutationObserver(function (mutations) {
			var el = document.getElementsByClassName('rt-tooltip')[0];
			if (el) {
				for (let color in this.colors) {
					if (typeof sources[color] === 'undefined') continue;

					for (let source of sources[color]) {
						if (wikicode.includes(source) || source === 'nih.gov' || source === 'twitter.com') {
							if (source.includes('.') && !source.includes(' ')) {
								$(el).has(`a[href*="${source.toLowerCase()}"]`).addClass('cite-highlighter-' + color);
								$(el).has(`a[href*="${source.toLowerCase()}"]`).children().first().addClass('cite-highlighter-' + color);
							}
						}
					}
				}
			}
		}).observe(document.body, {
			subtree: false,
			childList: true,
		});
	}

	getUnreliableWords() {
		// /(blog|blogspot|caard|\/comment|fandom|forum|preprint|railfan|thread|weebly|wix|wordpress|blockchain|crypto|innovative|podcast|about|newswire|release|announce|acquire)/gm
		return [
			'/comment',
			'about-me',
			'about-us',
			'/about/',
			'acquire',
			'announce',
			//'blockchain',
			'blog', // by far the most common hit
			'blogspot',
			'businesswire',
			'caard',
			'contact-us',
			'contactus',
			//'crypto',
			'fandom',
			'/forum/',
			'google.com/search',
			'innovative',
			'newswire',
			'podcast',
			'/post/',
			'preprint',
			'press-release',
			'pressrelease',
			'prnews',
			'railfan',
			'sponsored',
			'thread',
			'weebly',
			'wix',
			'wordpress',
		];
	}

	async getListOfSourcesAndRatings() {
		let sources = await this.getWikitextFromCache('User:Novem Linguae/Scripts/CiteHighlighter/SourcesJSON.js');
		sources = JSON.parse(sources);
		return sources;
	}

	setConfigVariableDefaultsIfNeeded() {
		if ( window.citeHighlighterHighlightEverything === undefined ) {
			window.citeHighlighterHighlightEverything = false;
		}
		if ( window.citeHighlighterLighterColors === undefined ) {
			window.citeHighlighterLighterColors = false;
		}
		if ( window.citeHighlighterAlwaysHighlightSourceLists === undefined ) {
			window.citeHighlighterAlwaysHighlightSourceLists = false;
		}
	}

	/**
	  * Don't highlight certain pages, for speed and visual appearance reasons.
	  *
	  * On pages with a lot of links (watchlist, WP:FA), highlighting EVERYTHING will double the
	  * load time. e.g. watchlist 5 seconds -> 10 seconds.
	  */
	isSlowPage() {
		if (
			mw.config.get('wgAction') == 'history' ||
			this.articleTitle == 'Main_Page' ||
			this.articleTitle == 'Wikipedia:Featured_articles' ||
			this.articleTitle == 'Special:Watchlist'
		) {
			return true;
		}

		return false;
	}

	/**
	  * If page is a source quality list, highlight everything, even if highlightEverything = false;
	  * Goal: easily see if the script is highlighting anything wrong.
	  */
	highlightSourceListsMoreAggressively() {
		let highlightEverythingList = [
			'Wikipedia:Reliable_sources/Perennial_sources',
			'Wikipedia:New_page_patrol_source_guide',
			'Wikipedia:WikiProject_Albums/Sources',
			'Wikipedia:WikiProject_Video_games/Sources#Reliable_sources',
			'Wikipedia:WikiProject_Anime_and_manga/Online_reliable_sources',
			'Wikipedia:WikiProject_Africa/Africa_Sources_List',
			'Wikipedia:WikiProject_Dungeons_%26_Dragons/References',
		];

		if ( window.citeHighlighterAlwaysHighlightSourceLists == true) {
			if ( highlightEverythingList.includes(this.articleTitle) ) {
				window.citeHighlighterHighlightEverything = true;
			}
		}
	}

	/**
	  * If page is a draft, highlight everything, as the # of links is small, and oftentimes
	  * inline citations are malformed
	  */
	highlightDraftsMoreAggressively() {
		if ( mw.config.get('wgNamespaceNumber') == 118 ) {
			window.citeHighlighterHighlightEverything = true;
		}
	}

	/**
	  * If highlightEverything = true, delete wikipedia.org and wiktionary. Too many false positives.
	  */
	preventWikipediaFalsePositives() {
		if ( window.citeHighlighterHighlightEverything ) {
			this.deleteAll(this.sources, 'en.wikipedia.org', 'wikipedia.org', 'wiktionary.org');
			this.deleteFromArray(this.unreliableWordsForOrangeHighlighting, 'wiki');
		}
	}

	getColors() {
		if ( window.citeHighlighterLighterColors ) {
			return {
				'unreliableWord':	'#ffb347',
				'preprint':			'#ffcfd5',
				'doi':				'transparent',
				'medrs': 			'#63ff70',
				'green': 			'#a6ffb9',
				'yellow': 			'#ffffcc',
				'red': 				'#ffcfd5',
			};
		} else {
			return {
				// order of these first 3 fixes an issue where published academic papers were being colored preprint red
				// lowest priority
				'unreliableWord':	'#ffb347', // orange for now, for easier testing. later will be red.
				'preprint':			'lightcoral',
				'doi':				'transparent',
				'medrs': 			'limegreen',
				'green': 			'lightgreen',
				'yellow': 			'khaki',
				'red': 				'lightcoral',
				//'aggregator':	'plum',	// turning off aggregator for now, red/yellow/green is nice and simple, purple makes the color scheme more complicated
				// highest priority
			};
		}
	}

	writeCSSForEachColor() {
		for ( let key in this.colors ) {
			mw.util.addCSS('.cite-highlighter-' + key + ' {background-color: ' + this.colors[key] + ';}');
			mw.util.addCSS('.rt-tooltipTail.cite-highlighter-' + key + '::after {background: ' + this.colors[key] + ';}');
		}
	}

	addHTMLClassesToRefs() {
		for ( let color in this.colors ) {
			if ( typeof this.sources[color] === 'undefined' ) continue;
			
			for ( let source of this.sources[color] ) {
				// This code makes the algorithm more efficient, by not adding CSS for sources that aren't found in the wikicode.
				// I programmed some exceptions to fix bugs. For example:
				// - {{Cite journal}} with a pubmed ID generates nih.gov without putting it in the wikicode
				// - {{Cite tweet}} generates twitter.com without putting it in the wikicode
				if ( this.wikicode.includes(source) || source === 'nih.gov' || source === 'twitter.com' ) {
					// highlight external links, if it contains a period and no space (i.e. a domain name)
					if ( source.includes('.') && ! source.includes(' ') ) {
						// highlight whole cite
						// [title="source" i]... the "i" part is not working in :has() for some reason
						// use .toLowerCase() for now
						// using .addClass() instead of .css() or .attr('style') because I'm having issues getting medrs to override arXiv/Wikidata/other red sources
						$('li[id^="cite_note-"]').has('a[href*="/'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						$('li[id^="cite_note-"]').has('a[href*=".'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						
						// Also support any {{Cite}} template in a list. For example, a works cited section supporting a references section consisting of "Smith 1986, pp. 573-574" type citations. Example: https://en.wikipedia.org/wiki/C._J._Cregg#Articles_and_tweets
						$('li').has('.citation a[href*="/'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						$('li').has('.citation a[href*=".'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);

						if ( window.citeHighlighterHighlightEverything ) {
							// highlight external link only
							// !important; needed for highlighting PDF external links. otherwise the HTML that generates the PDF icon has higher specificity, and makes it transparent
							// [title="source" i]... the "i" means case insensitive. Default is case sensitive.
							mw.util.addCSS('#bodyContent a[href*="/'+source+'" i] {background-color: '+this.colors[color]+' !important;}');
							mw.util.addCSS('#bodyContent a[href*=".'+source+'" i] {background-color: '+this.colors[color]+' !important;}');
						}
					}
				}
			}
		}
	}

	/**
	  * Be more aggressive with this list of words. Doesn't have to be the domain name. Can be
	  * anywhere in the URL. Example unreliableWord: blog.
	  */
	addHTMLClassesForUnreliableWords() {
		for ( let word of this.unreliableWordsForOrangeHighlighting ) {
			let color = 'unreliableWord';
			if ( this.wikicode.includes(word) ) {
				$('li[id^="cite_note-"]').has('a[href*="'+word.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
				if ( window.citeHighlighterHighlightEverything ) {
					mw.util.addCSS('#bodyContent a[href*="'+word+'" i] {background-color: '+this.colors[color]+' !important;}');
				}
			}
		}
	}

	async execute() {
		this.sources = await this.getListOfSourcesAndRatings();
		this.unreliableWordsForOrangeHighlighting = this.getUnreliableWords();

		this.setConfigVariableDefaultsIfNeeded();

		this.articleTitle = mw.config.get('wgPageName');
		if ( this.isSlowPage() ) {
			return;
		}

		this.highlightSourceListsMoreAggressively();
		this.highlightDraftsMoreAggressively();

		this.preventWikipediaFalsePositives();
		
		this.colors = this.getColors();

		this.writeCSSForEachColor();
		
		this.wikicode = await this.getWikicode(this.articleTitle);

		this.addHTMLClassesToRefs();

		this.addHTMLClassesForUnreliableWords();

		this.observeAndAddClassesToTooltips();
	}
}

// TODO: Idea from chlod: use mw.hook("wikipage.content").add( () => { rehiglight(); } ); instead. will listen for VE finishes saving or the page gets reloaded in any way. Gets called multiple times by accident sometimes though, so need to be careful not to apply duplicate classes to HTML elements.
$(async function() {
	// TODO: I don't think I use mediawiki.Title. Remove that, and replace with mediawiki.Api?
	await mw.loader.using(['mediawiki.util','mediawiki.Uri', 'mediawiki.Title'], async () => {
		let ch = new CiteHighlighter();
		await ch.execute();
	});
});

//</nowiki>