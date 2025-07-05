export class UnblockReview {
	constructor() {
		this.SIGNATURE = '~~~~';
	}

	/**
	 * Process the accept or decline of an unblock request.
	 *
	 * @param {string} wikitext - The wikitext of the page.
	 * @param {string} paramsAndReason - The parameters and reason of the unblock request, e.g.
	 *                                   "NewUsername|Reason" or "Reason". The initial pipe is omitted.
	 * @param {string} acceptDeclineReason - The reason for accepting or declining the unblock request.
	 * @param {string} DEFAULT_DECLINE_REASON - The default reason for declining the unblock request.
	 * @param {string} acceptOrDecline - Either "accept" or "decline".
	 * @return {string} wikitext
	 */
	processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) {
		// HTML does one line break and wikitext does 2ish. Cut off all text after the first line break to avoid breaking our search algorithm.
		paramsAndReason = paramsAndReason.split( '\n' )[ 0 ];

		let initialText = '';
		// Special case: If the user didn't provide a reason, the template will display "Please provide a reason as to why you should be unblocked", and this will be detected as the appealReason.
		const reasonIsProvided = !paramsAndReason.startsWith( 'Please provide a reason as to why you should be unblocked' );
		if ( !reasonIsProvided ) {
			initialText = wikitext.match( /(\{\{Unblock)\}\}/i )[ 1 ];
			paramsAndReason = '';
		} else {
			initialText = this.getLeftHalfOfUnblockTemplate( wikitext, paramsAndReason );
		}

		if ( !acceptDeclineReason.trim() ) {
			acceptDeclineReason = DEFAULT_DECLINE_REASON + ' ' + this.SIGNATURE;
		} else if ( !this.hasSignature( acceptDeclineReason ) ) {
			acceptDeclineReason = acceptDeclineReason + ' ' + this.SIGNATURE;
		}

		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>)';
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( initialText + paramsAndReason ), 'g' );
		const templateName = initialText.match( /^\{\{([A-Za-z-]+)/i )[ 1 ];
		let wikitext2 = wikitext.replace(
			regEx,
			'{{' + templateName + ' reviewed|' + acceptOrDecline + '=' + acceptDeclineReason + '|' + paramsAndReason
		);

		if ( wikitext === wikitext2 ) {
			throw new Error( 'Replacing text with unblock message failed!' );
		}

		// get rid of any [#*:] in front of {{unblock X}} templates. indentation messes up the background color and border of the unblock template.
		wikitext2 = wikitext2.replace( /^[#*: ]{1,}(\{\{\s*unblock)/mi, '$1' );

		return wikitext2;
	}

	/**
	 * Given the wikitext of an entire page, and the |reason= parameter of one of the many unblock templates (e.g. {{Unblock}}, {{Unblock-un}}, {{Unblock-auto}}, {{Unblock-bot}}, etc.), return the wikitext of just the beginning of the template.
	 *
	 * For example, "Test {{unblock|reason=Your reason here [[User:Filipe46]]}} Test" as the wikitext and "Your reason here" as the appealReason will return "{{unblock|reason=".
	 *
	 * This can also handle 1=, and no parameter at all (just a pipe)
	 */
	getLeftHalfOfUnblockTemplate( wikitext, appealReason ) {
		// Isolate the reason, stripping out all template syntax. So `{{Unblock|reason=ABC}}` becomes matches = [ 'ABC ']
		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>{{unblock\\|reason=)(?<!reviewed ?\\|1=)';
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];

		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed!' );
		}

		// Loop through all the potential matches, trying to find an {{Unblock template. If found, return the beginning of the template.
		for ( const match of matches ) {
			const matchPos = match.index;
			let unblockTemplateStartPos;

			// Scan backwards from the match until we find {{
			// Stop at the beginning of the string OR after 50 characters
			const stopPos = Math.max( 0, matchPos - 50 );
			for ( let i = matchPos; i > stopPos; i-- ) {
				if ( wikitext[ i ] === '{' && wikitext[ i - 1 ] === '{' ) {
					unblockTemplateStartPos = i - 1;
					break;
				}
			}

			// Don't match stuff that isn't an unblock template
			const initialText = wikitext.slice( unblockTemplateStartPos, matchPos );
			if ( !initialText.match( /^\{\{unblock/i ) ) {
				continue;
			}

			return initialText;
		}

		throw new Error( 'Searching backwards failed!' );
	}

	/**
	 * @copyright coolaj86, CC BY-SA 4.0, https://stackoverflow.com/a/6969486/3480193
	 */
	escapeRegExp( string ) {
		// $& means the whole matched string
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

	/**
	 * Is there a signature (four tildes) present in the given text, outside of a nowiki element?
	 */
	hasSignature( text ) {
		// no literal signature?
		if ( !text.includes( this.SIGNATURE ) ) {
			return false;
		}

		// if there's a literal signature and no nowiki elements,
		// there must be a real signature
		if ( !text.includes( '<nowiki>' ) ) {
			return true;
		}

		// Save all nowiki spans
		const nowikiSpanStarts = []; // list of ignored span beginnings
		const nowikiSpanLengths = []; // list of ignored span lengths
		const NOWIKI_RE = /<nowiki>.*?<\/nowiki>/g;
		let spanMatch;
		do {
			spanMatch = NOWIKI_RE.exec( text );
			if ( spanMatch ) {
				nowikiSpanStarts.push( spanMatch.index );
				nowikiSpanLengths.push( spanMatch[ 0 ].length );
			}
		} while ( spanMatch );

		// So that we don't check every ignore span every time
		let nowikiSpanStartIdx = 0;

		const SIG_RE = new RegExp( this.SIGNATURE, 'g' );
		let sigMatch;

		matchLoop:
		do {
			sigMatch = SIG_RE.exec( text );
			if ( sigMatch ) {
				// Check that we're not inside a nowiki
				for ( let nwIdx = nowikiSpanStartIdx; nwIdx <
					nowikiSpanStarts.length; nwIdx++ ) {
					if ( sigMatch.index > nowikiSpanStarts[ nwIdx ] ) {
						if ( sigMatch.index + sigMatch[ 0 ].length <=
							nowikiSpanStarts[ nwIdx ] + nowikiSpanLengths[ nwIdx ] ) {

							// Invalid sig
							continue matchLoop;
						} else {
							// We'll never encounter this span again, since
							// headers only get later and later in the wikitext
							nowikiSpanStartIdx = nwIdx;
						}
					}
				}

				// We aren't inside a nowiki
				return true;
			}
		} while ( sigMatch );
		return false;
	}
}
