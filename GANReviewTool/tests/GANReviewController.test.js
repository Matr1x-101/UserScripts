const { GANReviewController } = require("../modules/GANReviewController");
import { when } from 'jest-when';

let controller;
beforeEach(() => {
	controller = new GANReviewController();
});

// Private methods

describe('isGASubPage(title)', () => {
	test('capitalized, single digit', () => {
		let title = `Talk:Sora Amamiya/GA2`;
		let output = true;
		expect(controller.isGASubPage(title)).toBe(output);
	});

	test('capitalized, double digits', () => {
		let title = `Talk:Sora Amamiya/GA21`;
		let output = true;
		expect(controller.isGASubPage(title)).toBe(output);
	});

	test('subpage of GA page', () => {
		let title = `Talk:Sora Amamiya/GA2/test`;
		let output = false;
		expect(controller.isGASubPage(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora Amamiya`;
		let output = false;
		expect(controller.isGASubPage(title)).toBe(output);
	});

	test('main article', () => {
		let title = `Sora Amamiya`;
		let output = false;
		expect(controller.isGASubPage(title)).toBe(output);
	});

	test('lowercase', () => {
		let title = `Talk:Sora Amamiya/ga2`;
		let output = false;
		expect(controller.isGASubPage(title)).toBe(output);
	});
});

describe('getGATitle(title)', () => {
	test('talk and subpage', () => {
		let title = `Talk:Sora_Amamiya/GA2`;
		let output = 'Sora Amamiya';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('user page', () => {
		let title = `User:Novem_Linguae/sandbox`;
		let output = 'User:Novem Linguae';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('article itself', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('no underscores', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('no underscores for multi-word titles', () => {
		let title = `2021_French_Grand_Prix`;
		let output = '2021 French Grand Prix';
		expect(controller.getGATitle(title)).toBe(output);
	});

	test('should handle title with slash in it', () => {
		let title = `Talk:Forge Park/495 station/GA1`;
		let output = 'Forge Park/495 station';
		expect(controller.getGATitle(title)).toBe(output);
	});
});

describe('getGATalkTitle(gaTitle)', () => {
	test('mainspace', () => {
		let gaTitle = `Sora Amamiya`;
		let output = 'Talk:Sora Amamiya';
		expect(controller.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('two colons', () => {
		let gaTitle = `Magic: The Gathering rules`;
		let output = 'Talk:Magic: The Gathering rules';
		expect(controller.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('should handle title with slash in it', () => {
		let gaTitle = `Forge Park/495 station`;
		let output = 'Talk:Forge Park/495 station';
		expect(controller.getGATalkTitle(gaTitle)).toBe(output);
	});
});

describe('getGASubPageEditSummary(editSummary, detailedTopic)', () => {
	test('should handle an h5 that contains no extra spaces', () => {
		let editSummary = `promote [[Atari Games Corp. v. Oman]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])`;
		let detailedTopic = `=====Video game history and development=====`;
		let output = '/* Video game history and development */ promote [[Atari Games Corp. v. Oman]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';
		expect(controller.getGASubPageEditSummary(editSummary, detailedTopic)).toBe(output);
	});

	test('should handle an h5 that contains extra spaces', () => {
		let editSummary = `promote [[Atari Games Corp. v. Oman]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])`;
		let detailedTopic = `===== Video game history and development =====`;
		let output = '/* Video game history and development */ promote [[Atari Games Corp. v. Oman]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';
		expect(controller.getGASubPageEditSummary(editSummary, detailedTopic)).toBe(output);
	});

	test('should strip out italics', () => {
		let editSummary = `promote [[Rock and Hard Place]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])`;
		let detailedTopic = `=====''Better Call Saul''=====`;
		let output = '/* Better Call Saul */ promote [[Rock and Hard Place]] to good article ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';
		expect(controller.getGASubPageEditSummary(editSummary, detailedTopic)).toBe(output);
	});
});


describe('simplifyQueryRevisionsObject(queryRevisionsObject)', () => {
	test('Normal', () => {
		let queryRevisionsObject = {
			"batchcomplete": true,
			"warnings": {
				"main": {
					"warnings": "Subscribe to the mediawiki-api-announce mailing list at <https://lists.wikimedia.org/postorius/lists/mediawiki-api-announce.lists.wikimedia.org/> for notice of API deprecations and breaking changes. Use [[Special:ApiFeatureUsage]] to see usage of deprecated features by your application."
				},
				"revisions": {
					"warnings": "Because \"rvslots\" was not specified, a legacy format has been used for the output. This format is deprecated, and in the future the new format will always be used."
				}
			},
			"query": {
				"normalized": [
					{
						"fromencoded": false,
						"from": "Main_page",
						"to": "Main page"
					},
					{
						"fromencoded": false,
						"from": "User:Novem_Linguae",
						"to": "User:Novem Linguae"
					}
				],
				"pages": [
					{
						"pageid": 217225,
						"ns": 0,
						"title": "Main page",
						"revisions": [
							{
								"contentformat": "text/x-wiki",
								"contentmodel": "wikitext",
								"content": "#REDIRECT [[Main Page]]\n\n\n{{Redirect shell |\n  {{R from other capitalisation}}\n}}\n[[Category:Main Page| ]]\n[[Category:Protected pages associated with Main Page articles]]"
							}
						]
					},
					{
						"pageid": 67192006,
						"ns": 2,
						"title": "User:Novem Linguae",
						"revisions": [
							{
								"contentformat": "text/x-wiki",
								"contentmodel": "wikitext",
								"content": "__NOTOC__"
							}
						]
					}
				]
			}
		};
		let output = {
			"Main page": "#REDIRECT [[Main Page]]\n\n\n{{Redirect shell |\n  {{R from other capitalisation}}\n}}\n[[Category:Main Page| ]]\n[[Category:Protected pages associated with Main Page articles]]",
			"User:Novem Linguae": "__NOTOC__"
		};
		expect(controller.simplifyQueryRevisionsObject(queryRevisionsObject)).toStrictEqual(output);
	});
});

/*

// Not working yet

describe('execute($, mw, location)', () => {
	test('should handle a fail, with no {{atop}}', async () => {
		let ganReviewTitle = `Talk:Thomas Carlyle (Millais)/GA1`;
		let talkPageBefore =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		let talkPageAfter =
`{{FailedGA|19:20, 2 July 2022 (UTC)|topic=Art and architecture|page=1}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;

		let $ = jest.fn();

		let mw = {};
		mw.config = {};
		mw.config.get = jest.fn();
		when(mw.config.get).calledWith('wgPageName').mockReturnValue(ganReviewTitle);
		when(mw.config.get).calledWith('wgAction').mockReturnValue('view');
		when(mw.config.get).calledWith('wgDiffNewId').mockReturnValue(null);
		when(mw.config.get).calledWith('wgCurRevisionId').mockReturnValue(516020);
		when(mw.config.get).calledWith('wgNamespaceNumber').mockReturnValue(1);

		mw.Api = class {
			post(params) {
				let params1 = {
					action: "parse",
					page: "Talk:Thomas Carlyle (Millais)/GA1",
					prop: "wikitext",
					format: "json"
				};

				if ( JSON.stringify(params) === JSON.stringify(params1) ) {
					return {
						"parse": {
							"title": "Talk:Thomas Carlyle (Millais)/GA1",
							"pageid": 126945,
							"wikitext": {
								"*": "==GA Review==\n{{Good article tools}}\n<noinclude>{{al|{{#titleparts:Thomas Carlyle (Millais)/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:Thomas Carlyle (Millais)/GA1]]. The edit link for this section can be used to add comments to the review.''</includeonly>\n\n'''Reviewer:''' [[User:Kavyansh.Singh|Kavyansh.Singh]]&nbsp;([[User talk:Kavyansh.Singh|talk]] '''·''' [[Special:Contributions/Kavyansh.Singh|contribs]]) 20:00, 18 June 2022 (UTC)\n\n<!-- Please add all review comments below this comment, and do not alter what is above. So that the review can be kept within a single section, please do not use level 2 headers (==...==) below to break up the review. Use level 3 (===...===), level 4 and so on.-->\n'''Nominator:''' [[User:Sinopecynic|Sinopecynic]]&nbsp;([[User talk:Sinopecynic|talk]] '''·''' [[Special:Contributions/Sinopecynic|contribs]]) at 20:49, 10 May 2022 (UTC)\n\n=== GA criteria ===\n{| class=\"wikitable\" style=\"width: 100%; width:50em\"\n|-\n! height=50|[[Wikipedia:Good article nominations|GA]] review<br>{{small|(see [[Wikipedia:Good article criteria|here]] for what the criteria are, and [[WP:GACN|here]] for what they are not)}}\n|-\n|\n#It is '''reasonably well written'''.\n#:a ''(prose, spelling, and grammar)'': {{GAList/check|no}}<br/> b ''([[Wikipedia:Manual of Style|MoS]] for [[WP:LEAD|lead]], [[WP:LAYOUT|layout]], [[WP:WTW|word choice]], [[WP:WAF|fiction]], and [[Wikipedia:Embedded list|lists]])'': {{GAList/check|no}}\n#It is '''factually accurate''' and '''[[Wikipedia:Verifiability|verifiable]]'''.\n#:a ''(references)'': {{GAList/check|{{{2a}}}}} <br/>b ''(citations to [[WP:RS|reliable sources]])'': {{GAList/check|{{{2b}}}}} <br/>c ''([[Wikipedia:No original research|OR]])'': {{GAList/check|no}} <br/>d ''([[Wikipedia:Copyrights|copyvio]] and [[Wikipedia:Plagiarism|plagiarism]])'': {{GAList/check|{{{2d}}}}}\n#It is '''broad in its coverage'''.\n#:a ''(major aspects)'': {{GAList/check|?}} <br/>b ''(focused)'': {{GAList/check|{{{3b}}}}}\n#It follows the '''[[WP:NPOV|neutral point of view]] policy'''.\n#:''Fair representation without bias'': {{GAList/check|{{{4}}}}}\n#It is '''stable'''.\n#:''No edit wars, etc.'': {{GAList/check|{{{5}}}}}\n#It is illustrated by '''[[Wikipedia:Images|images]]''', where possible and appropriate.\n#:a ''(images are tagged and non-free images have [[Wikipedia:Non-free_use_rationale_guideline|fair use rationales]])'': {{GAList/check|{{{6a}}}}} <br/>b ''(appropriate use with [[WP:CAP|suitable captions]])'': {{GAList/check|{{{6b}}}}}\n|-\n| style=\"text-align:center;\" |\n'''Overall''':<br/> \n''Pass/Fail'': {{GAList/check|no}}<!-- Template:GAReview -->\n|-\n|-\n! height=30|[[File:Symbol_support_vote.svg|15px]] · [[File:Symbol_oppose_vote.svg|15px]] · [[File:Symbol_wait.svg|15px]] · [[File:Symbol_neutral_vote.svg|15px]]\n|-\n|}\n\n=== Comments ===\nI am afraid, but I'll have to quick-fail the article due to multiple reasons:\n* Recommending to have the [[WP:GOCE/REQ|GOCE]] copy-edit the article. The prose does not meet the criteria of being \"clear, concise, and understandable to an appropriately broad audience; spelling and grammar are correct\". We have many phrases which are unclear/difficult to understand. Example: \"It may have been one Mrs. Anstruther, a friend of Carlyle's who visited Millais' home to see the portrait, telling him that it was ...\", etc. There are a lot of blockquotes and other long quotations, some of which can easily be paraphrased in Wikipedia's voice.\n* It has quite a few MOS issues. [[MOS:LEAD]] states that the lead section should be a summary of the article. We have a single sentenced lead that is never mentioned in the prose. We have [[MOS:SANDWICH]] issues, etc. \n* Few of the direct quotations and text lacks a citation, when direct quotations should definitely have one. Few of the references lack an url-access date. \n\nOverall, it will take a long time, or even a complete re-write of the article to fix these issues. So I am failing the nomination for now, but suggest you to keep working on these issues, and do renominate after they have been fixed. – [[User:Kavyansh.Singh|Kavyansh.Singh]] ([[User talk:Kavyansh.Singh|talk]]) 04:09, 19 June 2022 (UTC)\n\n=== General discussion ===\nHi! I'll review this article as a part of the [[Wikipedia:WikiProject Good articles/GAN Backlog Drives/June 2022|June 2022 backlog drive]]. Feel free to let me know if you have any questions or need clarification for any point. – [[User:Kavyansh.Singh|Kavyansh.Singh]] ([[User talk:Kavyansh.Singh|talk]]) 19:56, 18 June 2022 (UTC)"
							}
						}
					}
				}

				throw new Error('mw.Api.post() mock: incoming parameters not in dictionary. ' + JSON.stringify(params));
			}
		};

		let location = {};
		location.reload() = jest.fn();

		await controller.execute($, mw, location);
		window.dispatchEvent(new Event('click'); // TODO: specify what is clicked

		expect(location.reload.mock.calls.length).toBe(1); // called once
	});
});

*/