import { Execution } from 'llm-functions-ts/src/llm';

export const exampleResponses = [
  {
    id: 'randomId',
    inputs: {
      instructions: {
        letter: 'A',
      },
    },

    finalResponse: {
      countryNames: [
        'Afghanistan',
        'Albania',
        'Algeria',
        'Andorra',
        'Angola',
        'Antigua and Barbuda',
        'Argentina',
        'Armenia',
        'Australia',
        'Austria',
        'Azerbaijan',
      ],
    },
    trace: [
      {
        action: 'calling-open-ai',
        template:
          'JSON SCHEMA:"""\n{"type":"object","properties":{"countryNames":{"type":"array","items":{"type":"string"}}},"required":["countryNames"],"additionalProperties":false}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nGenerate countries names that start with A.If the country doesn\'t exist, make some up\n"""',
        response: {
          type: 'success',
          output:
            '{"countryNames": ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan"]}',
        },
        id: 'm6qpJphRCBawiQj4Has4X',
      },
    ],
  },

  {
    id: '59vKIMuy7wWB6EZmv6R7U',
    trace: [
      {
        action: 'calling-open-ai',
        template:
          'JSON SCHEMA:"""\n{"type":"object","properties":{"websiteUrl":{"type":"string"}},"required":["websiteUrl"],"additionalProperties":false}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nWhat\'s a random website of a caterer.\n"""',
        response: {
          type: 'success',
          output: '{"websiteUrl": "http://www.cateringbyseasons.com/"}',
        },
        id: 'YhJhGL8OHwFFkMkuWlnHk',
      },
      {
        action: 'calling-another-function',
        functionDef: {
          output: {
            _def: {
              unknownKeys: 'strip',
              catchall: {
                _def: {
                  typeName: 'ZodNever',
                },
              },
              typeName: 'ZodObject',
            },
            _cached: {
              shape: {
                steps: {
                  _def: {
                    type: {
                      _def: {
                        checks: [],
                        typeName: 'ZodString',
                        coerce: false,
                      },
                    },
                    minLength: null,
                    maxLength: null,
                    exactLength: null,
                    typeName: 'ZodArray',
                  },
                },
                finalResponse: {
                  _def: {
                    options: [
                      {
                        _def: {
                          unknownKeys: 'strip',
                          catchall: {
                            _def: {
                              typeName: 'ZodNever',
                            },
                          },
                          typeName: 'ZodObject',
                        },
                        _cached: {
                          shape: {
                            type: {
                              _def: {
                                value: 'email',
                                typeName: 'ZodLiteral',
                              },
                            },
                            data: {
                              _def: {
                                checks: [],
                                typeName: 'ZodString',
                                coerce: false,
                              },
                            },
                          },
                          keys: ['type', 'data'],
                        },
                      },
                      {
                        _def: {
                          unknownKeys: 'strip',
                          catchall: {
                            _def: {
                              typeName: 'ZodNever',
                            },
                          },
                          typeName: 'ZodObject',
                        },
                        _cached: null,
                      },
                    ],
                    typeName: 'ZodUnion',
                  },
                },
              },
              keys: ['steps', 'finalResponse'],
            },
          },
          tsOutputString:
            '{\n    steps: string[];\n    finalResponse: {\n        type: "email";\n        data: string;\n    } | {\n        type: "contactUrl";\n        data: string;\n    };\n}',
          executions: [
            {
              id: 'uw8oenjqDA_YF93Ccfwus',
              trace: [],
              inputs: {
                documents: ['http://www.cateringbyseasons.com/'],
              },
            },
          ],
          model: {
            verbose: false,
            caller: {
              maxConcurrency: null,
              maxRetries: 6,
              queue: {
                _events: {},
                _eventsCount: 0,
                _intervalCount: 1,
                _intervalEnd: 0,
                _pendingCount: 0,
                _carryoverConcurrencyCount: false,
                _isIntervalIgnored: true,
                _intervalCap: null,
                _interval: 0,
                _queue: {
                  _queue: [],
                },
                _concurrency: null,
                _throwOnTimeout: false,
                _isPaused: false,
              },
            },
            temperature: 0,
            topP: 1,
            frequencyPenalty: 0,
            presencePenalty: 0,
            n: 1,
            modelName: 'gpt-3.5-turbo',
            modelKwargs: {},
            streaming: false,
            client: {
              basePath: 'https://api.openai.com/v1',
              configuration: {
                apiKey: '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',
                baseOptions: {
                  headers: {
                    'User-Agent': 'OpenAI/NodeJS/3.2.1',
                    Authorization:
                      'Bearer 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',
                  },
                },
              },
            },
            clientConfig: {
              apiKey: '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',
            },
          },
          name: 'Get contact info from website',
          instructions:
            'Follow these instructions to the dor get the contact info from the website. Let\'s work this out in a step by step way to be sure we have the right answer\n1. Look for an email from the Document attached above\n2. If you cannot find the email, then find the contact page from the Document attached above.\n3. Otherwise return "not found\nDo not output the email if it doesn\'t exist in the Document. See examples below.\nDo not make up the email. DO not hallucinate.\nEXAMPLES: \n\nDOCUMENT: <html><body><p>hello</p><a href="/contact">Contact</a></body></html>\nOUTPUT: {{\n  "steps": [\n    "Looking for the email in the document",\n    "Email not found",\n    "Looking for the contact page in the document",\n    "Found the contact page",\n    "Contact page is /contact"\n  ],\n  "finalResponse": {{ "type": "contactUrl", "data": "/contact" }}\n}}\n',
          documents: [
            {
              type: 'url',
              name: 'url',
              chunkingQuery: 'Contact info',
            },
          ],
          dataset: [
            {
              documents: ['https://avecplaisirs.com'],
            },
            {
              documents: ['https://nycateringservice.com/'],
            },
            {
              documents: ['https://relishcaterers.com/corporate/'],
            },
          ],
          id: 'ee0bbadc73ed0ae47a51d241bfba2c82e7af224ec70662e9dfbff0bc9d47edee',
        },
        input: {
          documents: ['http://www.cateringbyseasons.com/'],
        },
        id: '4tbR_6nGFmIovODttA4Iz',
      },
      {
        action: 'get-document',
        input: {
          type: 'url',
          name: 'url',
          chunkingQuery: 'Contact info',
          input: 'http://www.cateringbyseasons.com/',
        },
        response: {
          type: 'success',
          output:
            '<footer class="page-footer section-page-small">\n    <div class="container">\n      <div class="row">\n        <div class="col-md-3">\n          <div class="svg logo-seasons svg-logo-seasons-white"></div>\n        </div>\n        <div class="col-md-3">\n          <div class="footer-addr addr-contact">\n            <span class="footer-addr-phone"><big><b>301-477-3515</b></big></span><br>\n            <a href="mailto:inquiry@cateringbyseasons.com">inquiry@cateringbyseasons.com</a><br>\n            <a href="https://www.cateringbyseasons.com/cater-my-event/">Send Us a Message</a>\n          </div>\n        </div>\n        <div class="col-md-3">\n          <div class="footer-addr addr-addr">\n            5105 Berwyn Road<br>\n            College Park, MD 20740\n          </div>\n        </div>\n        <div class="col-md-3">\n          <div class="social-share">\n            <a href="https://twitter.com/LaPrimaFood" class="btn btn-social btn-twitter" title="Follow Us on Twitter"><span class="svg svg-twitter">Twitter</span></a>\n            <a href="https://www.facebook.com/cateringbyseasons" class="btn btn-social btn-facebook" title="Follow Us on Facebook"><span class="svg svg-facebook">Facebook</span></a>\n            <a href="https://instagram.com/cateringbyseasons/" class="btn btn-social btn-instagram" title="Follow Us on Instagram"><span class="svg svg-instagram">Instagram</span></a>\n            <a href="https://www.pinterest.com/cateringseasons/" class="btn btn-social btn-pinterest" title="Follow Us on Pinterest"><span class="svg svg-pinterest">Pinterest</span></a>\n          </div>\n        </div>\n      </div>\n      <div class="row">\n        <div class="col-md-12">\n          <ul id="footer-navigation" class="nav navbar-nav page-navbar-nav footer-navbar-nav"><li class="menu-services"><a href="https://www.cateringbyseasons.com/catering-services/">Services</a></li>\n<li class="menu-menus"><a href="https://www.cateringbyseasons.com/menus/">Menus</a></li>\n<li class="menu-sustainability"><a href="https://www.cateringbyseasons.com/seeds-to-celebration/">Sustainability</a></li>\n<li class="menu-venues"><a href="https://www.cateringbyseasons.com/venues/">Venues</a></li>\n<li class="menu-photos"><a href="https://www.cateringbyseasons.com/photo-gallery/">Photos</a></li>\n<li class="menu-testimonials"><a href="https://www.cateringbyseasons.com/testimonials/">Testimonials</a></li>\n<li class="menu-press"><a href="https://www.cateringbyseasons.com/press/">Press</a></li>\n<li class="menu-blog"><a href="https://www.cateringbyseasons.com/blog/">Blog</a></li>\n<li class="menu-work-with-us"><a href="https://www.cateringbyseasons.com/work-with-us/">Work with Us</a></li>\n</ul>        </div>\n      </div>\n      <hr>\n<p class="post-excerpt"><input class="jpibfi" type="hidden"></p><p>Visit us online or call to order today!</p>\n<p></p>\n\n            <div class="post-meta">\n              <span class="post-date"><time class="published" datetime="2023-03-20T23:53:02+00:00">March 20, 2023</time>\n<p class="byline author vcard hidden">By <a href="https://www.cateringbyseasons.com/blog/author/admin/" rel="author" class="fn">Administrator</a></p>\n</span><br>\n              <span class="post-cat"><a href="https://www.cateringbyseasons.com/blog/category/brunch/" rel="category tag">Brunch</a> <a href="https://www.cateringbyseasons.com/blog/category/desserts/" rel="category tag">Desserts</a> <a href="https://www.cateringbyseasons.com/blog/category/event-ideas/" rel="category tag">Event Ideas</a> <a href="https://www.cateringbyseasons.com/blog/category/holiday/" rel="category tag">Holiday</a> <a href="https://www.cateringbyseasons.com/blog/category/menus/" rel="category tag">Menus</a> <a href="https://www.cateringbyseasons.com/blog/category/our-food/" rel="category tag">Our Food</a></span>\n            </div>\n          </article>\n        </div>\n          </div>\n  </div>\n</section>\n\n  <hr class="svg svg-spade-divider">\n\n<section class="section-page-smaller section-reviews">\n  <div class="container">\n\n    <h2 class="section-title">Reviews</h2>\n<div class="row">\n        <div class="col-md-6 col-md-push-6 footer-partners">\n          <a href="http://www.laprimafoodgroup.com/" target="_blank" class="svg svg-logo-foodgroup footer-partner"><span class="sr-only">La Prima Food Group</span></a>\n          <a href="http://www.laprimacatering.com/" target="_blank" class="svg svg-logo-catering footer-partner"><span class="sr-only">La Prima Catering</span></a>\n        </div>\n        <div class="col-md-6 col-md-pull-6">\n          <p class="copyright">\n            © 2023 La Prima Food Group, Inc.\n          </p>\n        </div>\n      </div>\n    </div>\n  </footer>\n\n</div><!-- END: #page-content -->\n\n  <script type="text/javascript">\n/* <![CDATA[ */\nvar jpibfi_options = {"hover":{"siteTitle":"Catering by Seasons","image_selector":".jpibfi_container img","disabled_classes":"wp-smiley;nopin","enabled_classes":"","min_image_height":300,"min_image_height_small":0,"min_image_width":300,"min_image_width_small":0,"show_on":"[front],[home],[single],[page],[archive],[search],[category]","disable_on":"","show_button":"hover","button_margin_bottom":20,"button_margin_top":20,"button_margin_left":20,"button_margin_right":20,"button_position":"top-left","description_option":["img_title","img_alt","post_title"],"transparency_value":0.2,"pin_image":"default","pin_image_button":"square","pin_image_icon":"circle","pin_image_size":"small","custom_image_url":"","scale_pin_image":false,"pin_linked_url":true,"pinLinkedImages":true,"pinImageHeight":43.2,"pinImageWidth":43.2,"scroll_selector":"","support_srcset":false}};\n/* ]]> */\n</script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-content/plugins/jquery-pin-it-button-for-images/js/jpibfi.client.js?ver=3.0.4"></script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-content/themes/cbs/assets/js/scripts.min.js?32a088c3c09e8428f0405379ab1696c2"></script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-includes/js/wp-embed.min.js?ver=5.2.3"></script>\n<script>\n      (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=\n    function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;\n    e=o.createElement(i);r=o.getElementsByTagName(i)[0];\n    e.src=\'//www.google-analytics.com/analytics.js\';\n    r.parentNode.insertBefore(e,r)}(window,document,\'script\',\'ga\'));\n    ga(\'create\',\'UA-38632920-2\',\'auto\');ga(\'send\',\'pageview\');\n</script>\n\n\n  <script src="//instant.page/1.2.2" type="module" integrity="sha384-2xV8M5griQmzyiY3CDqh1dn4z3llDVqZDqzjzcY+jCBCk/a5fXJmuZ/40JJAPeoU"></script>\n\n\n\n</body></html>\n<div class="sr-only" itemprop="author" itemscope="" itemtype="http://schema.org/Person">\n            <meta itemprop="name" content="Aleks">\n          </div>\n          <div class="sr-only" itemprop="itemReviewed" itemscope="" itemtype="http://schema.org/Thing">\n            <meta itemprop="serviceType" content="Catering">\n            <meta itemprop="name" content="Review by Aleks">\n          </div>\n\n          <p class="review-rating" itemprop="reviewRating" itemscope="" itemtype="http://schema.org/Rating">\n            <meta itemprop="worstRating" content="0">\n            <meta itemprop="ratingValue" content="5">\n            <meta itemprop="bestRating" content="5">\n            <a class="text-decoration: none;" target="_blank" title="Read Aleks\'s Full Review" href="http://www.weddingwire.com/reviews/catering-by-seasons-college-park/90dae39e057adc39.html">\n              <span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span>\n            </a>\n          </p>\n        </div>\n      </div>\n\n            <div class="col-sm-4">\n        <div class="thumbnail thumbnail-review wow fadeIn" itemscope="" itemtype="http://schema.org/Review">\n          <meta itemprop="name" content="Review by Tobi">\n          <meta itemprop="reviewBody" content="Catering By Seasons exceeded my expectation. I used them for a brunch at my house after my son’s bar mitzvah. The level of professionalism along with their responsiveness made me feel at ease right away. I worked with Glynis and she was unbelievably amazing. The food was fantastic, the attention to my no nuts requirement was so appreciated and the staff was diligent and friendly. Highly recommend them. I will definitely use them again.">\n          <meta itemprop="datePublished" content="May 6, 2018">\n\n          <p class="review-excerpt" itemprop="description">Catering By Seasons exceeded my expectation. I used them for a brunch at my house after my son’s bar mitzvah. The level of professionalism along with their responsiveness made me feel at ease right away.</p>\n\n          <div class="sr-only" itemprop="author" itemscope="" itemtype="http://schema.org/Person">\n            <meta itemprop="name" content="Tobi">\n          </div>\n          <div class="sr-only" itemprop="itemReviewed" itemscope="" itemtype="http://schema.org/Thing">\n            <meta itemprop="serviceType" content="Catering">\n            <meta itemprop="name" content="Review by Tobi">\n          </div>',
        },
        id: '8KgHE3QyCghYeyLgecETH',
      },
      {
        action: 'calling-open-ai',
        template:
          'DOCUMENT:"""\n  <footer class="page-footer section-page-small">\n    <div class="container">\n      <div class="row">\n        <div class="col-md-3">\n          <div class="svg logo-seasons svg-logo-seasons-white"></div>\n        </div>\n        <div class="col-md-3">\n          <div class="footer-addr addr-contact">\n            <span class="footer-addr-phone"><big><b>301-477-3515</b></big></span><br>\n            <a href="mailto:inquiry@cateringbyseasons.com">inquiry@cateringbyseasons.com</a><br>\n            <a href="https://www.cateringbyseasons.com/cater-my-event/">Send Us a Message</a>\n          </div>\n        </div>\n        <div class="col-md-3">\n          <div class="footer-addr addr-addr">\n            5105 Berwyn Road<br>\n            College Park, MD 20740\n          </div>\n        </div>\n        <div class="col-md-3">\n          <div class="social-share">\n            <a href="https://twitter.com/LaPrimaFood" class="btn btn-social btn-twitter" title="Follow Us on Twitter"><span class="svg svg-twitter">Twitter</span></a>\n            <a href="https://www.facebook.com/cateringbyseasons" class="btn btn-social btn-facebook" title="Follow Us on Facebook"><span class="svg svg-facebook">Facebook</span></a>\n            <a href="https://instagram.com/cateringbyseasons/" class="btn btn-social btn-instagram" title="Follow Us on Instagram"><span class="svg svg-instagram">Instagram</span></a>\n            <a href="https://www.pinterest.com/cateringseasons/" class="btn btn-social btn-pinterest" title="Follow Us on Pinterest"><span class="svg svg-pinterest">Pinterest</span></a>\n          </div>\n        </div>\n      </div>\n      <div class="row">\n        <div class="col-md-12">\n          <ul id="footer-navigation" class="nav navbar-nav page-navbar-nav footer-navbar-nav"><li class="menu-services"><a href="https://www.cateringbyseasons.com/catering-services/">Services</a></li>\n<li class="menu-menus"><a href="https://www.cateringbyseasons.com/menus/">Menus</a></li>\n<li class="menu-sustainability"><a href="https://www.cateringbyseasons.com/seeds-to-celebration/">Sustainability</a></li>\n<li class="menu-venues"><a href="https://www.cateringbyseasons.com/venues/">Venues</a></li>\n<li class="menu-photos"><a href="https://www.cateringbyseasons.com/photo-gallery/">Photos</a></li>\n<li class="menu-testimonials"><a href="https://www.cateringbyseasons.com/testimonials/">Testimonials</a></li>\n<li class="menu-press"><a href="https://www.cateringbyseasons.com/press/">Press</a></li>\n<li class="menu-blog"><a href="https://www.cateringbyseasons.com/blog/">Blog</a></li>\n<li class="menu-work-with-us"><a href="https://www.cateringbyseasons.com/work-with-us/">Work with Us</a></li>\n</ul>        </div>\n      </div>\n      <hr>\n<p class="post-excerpt"><input class="jpibfi" type="hidden"></p><p>Visit us online or call to order today!</p>\n<p></p>\n\n            <div class="post-meta">\n              <span class="post-date"><time class="published" datetime="2023-03-20T23:53:02+00:00">March 20, 2023</time>\n<p class="byline author vcard hidden">By <a href="https://www.cateringbyseasons.com/blog/author/admin/" rel="author" class="fn">Administrator</a></p>\n</span><br>\n              <span class="post-cat"><a href="https://www.cateringbyseasons.com/blog/category/brunch/" rel="category tag">Brunch</a> <a href="https://www.cateringbyseasons.com/blog/category/desserts/" rel="category tag">Desserts</a> <a href="https://www.cateringbyseasons.com/blog/category/event-ideas/" rel="category tag">Event Ideas</a> <a href="https://www.cateringbyseasons.com/blog/category/holiday/" rel="category tag">Holiday</a> <a href="https://www.cateringbyseasons.com/blog/category/menus/" rel="category tag">Menus</a> <a href="https://www.cateringbyseasons.com/blog/category/our-food/" rel="category tag">Our Food</a></span>\n            </div>\n          </article>\n        </div>\n          </div>\n  </div>\n</section>\n\n  <hr class="svg svg-spade-divider">\n\n<section class="section-page-smaller section-reviews">\n  <div class="container">\n\n    <h2 class="section-title">Reviews</h2>\n<div class="row">\n        <div class="col-md-6 col-md-push-6 footer-partners">\n          <a href="http://www.laprimafoodgroup.com/" target="_blank" class="svg svg-logo-foodgroup footer-partner"><span class="sr-only">La Prima Food Group</span></a>\n          <a href="http://www.laprimacatering.com/" target="_blank" class="svg svg-logo-catering footer-partner"><span class="sr-only">La Prima Catering</span></a>\n        </div>\n        <div class="col-md-6 col-md-pull-6">\n          <p class="copyright">\n            © 2023 La Prima Food Group, Inc.\n          </p>\n        </div>\n      </div>\n    </div>\n  </footer>\n\n</div><!-- END: #page-content -->\n\n  <script type="text/javascript">\n/* <![CDATA[ */\nvar jpibfi_options = {"hover":{"siteTitle":"Catering by Seasons","image_selector":".jpibfi_container img","disabled_classes":"wp-smiley;nopin","enabled_classes":"","min_image_height":300,"min_image_height_small":0,"min_image_width":300,"min_image_width_small":0,"show_on":"[front],[home],[single],[page],[archive],[search],[category]","disable_on":"","show_button":"hover","button_margin_bottom":20,"button_margin_top":20,"button_margin_left":20,"button_margin_right":20,"button_position":"top-left","description_option":["img_title","img_alt","post_title"],"transparency_value":0.2,"pin_image":"default","pin_image_button":"square","pin_image_icon":"circle","pin_image_size":"small","custom_image_url":"","scale_pin_image":false,"pin_linked_url":true,"pinLinkedImages":true,"pinImageHeight":43.2,"pinImageWidth":43.2,"scroll_selector":"","support_srcset":false}};\n/* ]]> */\n</script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-content/plugins/jquery-pin-it-button-for-images/js/jpibfi.client.js?ver=3.0.4"></script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-content/themes/cbs/assets/js/scripts.min.js?32a088c3c09e8428f0405379ab1696c2"></script>\n<script type="text/javascript" src="https://www.cateringbyseasons.com/wp-includes/js/wp-embed.min.js?ver=5.2.3"></script>\n<script>\n      (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=\n    function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;\n    e=o.createElement(i);r=o.getElementsByTagName(i)[0];\n    e.src=\'//www.google-analytics.com/analytics.js\';\n    r.parentNode.insertBefore(e,r)}(window,document,\'script\',\'ga\'));\n    ga(\'create\',\'UA-38632920-2\',\'auto\');ga(\'send\',\'pageview\');\n</script>\n\n\n  <script src="//instant.page/1.2.2" type="module" integrity="sha384-2xV8M5griQmzyiY3CDqh1dn4z3llDVqZDqzjzcY+jCBCk/a5fXJmuZ/40JJAPeoU"></script>\n\n\n\n</body></html>\n<div class="sr-only" itemprop="author" itemscope="" itemtype="http://schema.org/Person">\n            <meta itemprop="name" content="Aleks">\n          </div>\n          <div class="sr-only" itemprop="itemReviewed" itemscope="" itemtype="http://schema.org/Thing">\n            <meta itemprop="serviceType" content="Catering">\n            <meta itemprop="name" content="Review by Aleks">\n          </div>\n\n          <p class="review-rating" itemprop="reviewRating" itemscope="" itemtype="http://schema.org/Rating">\n            <meta itemprop="worstRating" content="0">\n            <meta itemprop="ratingValue" content="5">\n            <meta itemprop="bestRating" content="5">\n            <a class="text-decoration: none;" target="_blank" title="Read Aleks\'s Full Review" href="http://www.weddingwire.com/reviews/catering-by-seasons-college-park/90dae39e057adc39.html">\n              <span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span><span class="star-review svg svg-star-full"></span>\n            </a>\n          </p>\n        </div>\n      </div>\n\n            <div class="col-sm-4">\n        <div class="thumbnail thumbnail-review wow fadeIn" itemscope="" itemtype="http://schema.org/Review">\n          <meta itemprop="name" content="Review by Tobi">\n          <meta itemprop="reviewBody" content="Catering By Seasons exceeded my expectation. I used them for a brunch at my house after my son’s bar mitzvah. The level of professionalism along with their responsiveness made me feel at ease right away. I worked with Glynis and she was unbelievably amazing. The food was fantastic, the attention to my no nuts requirement was so appreciated and the staff was diligent and friendly. Highly recommend them. I will definitely use them again.">\n          <meta itemprop="datePublished" content="May 6, 2018">\n\n          <p class="review-excerpt" itemprop="description">Catering By Seasons exceeded my expectation. I used them for a brunch at my house after my son’s bar mitzvah. The level of professionalism along with their responsiveness made me feel at ease right away.</p>\n\n          <div class="sr-only" itemprop="author" itemscope="" itemtype="http://schema.org/Person">\n            <meta itemprop="name" content="Tobi">\n          </div>\n          <div class="sr-only" itemprop="itemReviewed" itemscope="" itemtype="http://schema.org/Thing">\n            <meta itemprop="serviceType" content="Catering">\n            <meta itemprop="name" content="Review by Tobi">\n          </div>\n  """JSON SCHEMA:"""\n{"type":"object","properties":{"steps":{"type":"array","items":{"type":"string"}},"finalResponse":{"anyOf":[{"type":"object","properties":{"type":{"type":"string","enum":["email"]},"data":{"type":"string"}},"required":["type","data"],"additionalProperties":false},{"type":"object","properties":{"type":{"type":"string","enum":["contactUrl"]},"data":{"type":"string"}},"required":["type","data"],"additionalProperties":false}]}},"required":["steps","finalResponse"],"additionalProperties":false}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nFollow these instructions to the dor get the contact info from the website. Let\'s work this out in a step by step way to be sure we have the right answer\n1. Look for an email from the Document attached above\n2. If you cannot find the email, then find the contact page from the Document attached above.\n3. Otherwise return "not found\nDo not output the email if it doesn\'t exist in the Document. See examples below.\nDo not make up the email. DO not hallucinate.\nEXAMPLES: \n\nDOCUMENT: <html><body><p>hello</p><a href="/contact">Contact</a></body></html>\nOUTPUT: {\n  "steps": [\n    "Looking for the email in the document",\n    "Email not found",\n    "Looking for the contact page in the document",\n    "Found the contact page",\n    "Contact page is /contact"\n  ],\n  "finalResponse": { "type": "contactUrl", "data": "/contact" }\n}\n\n"""',
        response: {
          type: 'success',
          output:
            '{\n  "steps": [\n    "Looking for the email in the document",\n    "Found the email in the document"\n  ],\n  "finalResponse": { "type": "email", "data": "inquiry@cateringbyseasons.com" }\n}',
        },
        id: 'TFisZr1uSTgAvy9IrxA3q',
      },
    ],
    inputs: {},
    finalResponse: {
      steps: [
        'Looking for the email in the document',
        'Found the email in the document',
      ],
      finalResponse: {
        type: 'email',
        data: 'inquiry@cateringbyseasons.com',
      },
    },
  },
] satisfies Execution<any>[];
