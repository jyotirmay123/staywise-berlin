export const sources:any={
inside:['Inside Airbnb · downloads & CC BY 4.0','https://insideairbnb.com/get-the-data/'],
assumptions:['Inside Airbnb · methodology','https://insideairbnb.com/data-assumptions/'],
policies:['Inside Airbnb · archive policy','https://insideairbnb.com/data-policies/'],
tourism:['Official monthly tourism · Berlin-Brandenburg','https://www.statistik-berlin-brandenburg.de/g-iv-1-m/'],
districts:['Official Berlin district tourism','https://www.statistik-berlin-brandenburg.de/tourismus-berlin/'],
potsdamStats:['Official Potsdam tourism context','https://www.statistik-berlin-brandenburg.de/g-iv-8-m/'],
law:['Berlin · housing-use rules, including 2026 changes','https://www.berlin.de/sen/wohnen/rechtliches/zweckentfremdungsverbot/'],
permit:['Berlin · housing-use permission','https://service.berlin.de/dienstleistung/326217/'],
registration:['Berlin · accommodation registration number','https://service.berlin.de/dienstleistung/355975/'],
potsdam:['Potsdam · housing-use permissions and eight-week threshold','https://serviceportal.dikom-bb.de/landeshauptstadt-potsdam/zentrale-dienstleistung/9420_erteilung-einer-genehmigung-fuer-andere-als-zu-wohnzwecken-genutzter-wohnraum'],
bgh:['BGH · tourist subletting requires specific consent','https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2018&Gericht=bgh&file=dokument.pdf&linked=urt&nr=66637'],
trade:['Berlin · business registration','https://service.berlin.de/dienstleistung/121921/'],
tax:['Berlin · overnight tax','https://service.berlin.de/dienstleistung/326105/'],
taxGuide:['Berlin · cleaning is included in overnight-tax base','https://www.berlin.de/sen/finanzen/steuern/downloads/uebernachtungsteuer/leitfaden-uebernachtungsteuer_rechtslage-ab-01012025-01-2025.pdf?ts=1737531790'],
potsdamTax:['Potsdam · overnight tax','https://serviceportal.dikom-bb.de/landeshauptstadt-potsdam/zentrale-dienstleistung/4227_uebernachtungssteuer'],
vat:['UStG §19 · small-business VAT rules','https://www.gesetze-im-internet.de/ustg_1980/__19.html'],
vatStart:['ELSTER · founding-year VAT threshold','https://www.elster.de/eportal/helpGlobal?themaGlobal=help_ustva_2025'],
reverse:['IHK · reverse-charge obligations for small businesses','https://www.ihk.sow.de/Kleinunternehmerreglung.HTM'],
guest:['BMG §29 · guest registration','https://www.gesetze-im-internet.de/bmg/__29.html'],
partnership:['BGB §721 · personal liability of GbR partners','https://www.gesetze-im-internet.de/bgb/__721.html'],
fees:['Airbnb · host service fees','https://www.airbnb.com/help/article/1857'],
launch:['Airbnb · how to start hosting','https://www.airbnb.com/resources/hosting-homes/a/how-to-get-started-on-airbnb-3'],
insurance:['Airbnb · AirCover and insurance','https://www.airbnb.com/help/article/3142'],
airTax:['Airbnb · verify tax collection','https://www.airbnb.de/help/article/1036'],
airdna:['AirDNA · plans','https://www.airdna.co/'],
api:['AirDNA · API pricing and licences','https://www.airdna.co/vacation-rental-data-api'],
publicPotsdam:['AirDNA · free public Potsdam overview','https://www.airdna.co/vacation-rental-data/app/de/brandenburg/potsdam/overview'],
airbtics:['Airbtics · pricing','https://airbtics.com/product-pricing'],
request:['Inside Airbnb · archive and new-region requests','https://insideairbnb.com/data-requests/'],
nochmall:['BSR NochMall · used furniture','https://www.bsr.de/nochmall'],
klein:['Kleinanzeigen · used furniture in Berlin','https://www.kleinanzeigen.de/s-berlin/gebrauchte-m%C3%B6bel/k0l3331'],
ikea:['IKEA · NEIDEN bed frame','https://www.ikea.com/de/de/p/neiden-bettgestell-kiefer-70395239/'],
cleaning:['Helpling · cleaning price overview','https://www.helpling.de/preise/'],
spandau:['Spandau · housing office','https://service.berlin.de/dienstleistung/352954/standort/122604/']
};
export const tourism:any={'2023':[1644746,1925059,2228004,2598159,2665986,2756469,2971402,2775654,2801039,2728227,2253117,2241581],'2024':[1716701,2066651,2478772,2553719,2837588,2706809,2969119,2905546,2748183,2855635,2387430,2380931],'2025':[1724267,1985540,2278178,2551751,2711068,2689621,2917685,268?0:2631895,2577661,2709352,2329794,2336479],'2026':[1728246,1857417,2286598,2409277,2626747,2649980,2807246]};
tourism['2025'][7]=2631895;
export const furniture=[
['Bed frame and slats',120,200,'Buy simple','NEIDEN frame was €90; slats and mattress are extra.','ikea'],
['New mattress and protector',190,320,'Buy new','Planning allowance; prioritise comfort and a washable protector.','ikea'],
['Three linen sets, towels and pillows',180,300,'Buy new','Planning allowance for two guests and laundry backup.','ikea'],
['Table, chairs, wardrobe and lamps',150,400,'Buy used','Targets, not guaranteed offers. Inspect before paying.','klein'],
['Sofa or easy chairs',80,250,'Inspect carefully','Check pests, odours, damage and collection cost.','nochmall'],
['Kitchenware and small appliances',160,300,'Mix new and used','Assumes a working fitted kitchen already exists.','nochmall'],
['Curtains, lighting, mirror and décor',120,250,'Keep consistent','Simple neutral colours and bright bulbs photograph well.','ikea'],
['Safety, entry and cleaning kit',100,200,'Do properly','Not a certified safety package; requirements may cost more.','insurance'],
['Transport, assembly and small fixes',150,350,'Budget explicitly','Include van hire, parking, lifting help and fittings.','klein']
];
export const legal=[
['Check approved property use','Ask the housing office and building authority about the exact address and intended use. Landlord consent, housing-use permission, building approval and registration are separate requirements. A commercial advert does not prove that tourist accommodation is approved.',['law','permit']],
['Apply the correct local rule','Berlin: sharing at most 49% of your genuine primary home may be exempt from the housing-use permit, but registration is still required and shared-space calculations matter. Whole-home hosting during absence needs a permit. The 90-day secondary-home rule is not a blanket allowance for rented flats. Potsdam: tourist use exceeding eight weeks a year is a housing-use trigger; do not transfer Berlin thresholds to another town.',['law','potsdam']],
['Get explicit tourist-hosting consent','Request written permission for repeated paid short stays by changing guests, the platforms used, maximum guests, keys and quiet hours. Ordinary subletting permission is not enough. Check the owner’s authority, building rules and any owners’ association restrictions. Make your lease conditional on the required public approvals.',['bgh']],
['Obtain the unit registration','Berlin’s separate registration procedure reflects the 2026 changes. Obtain a required permit first, then the registration number for the unit and host. Display it when advertising. Private individuals can use BundID online; legal persons currently apply in writing. Verify current instructions.',['registration']],
['Separate Gewerbe, tax and Anmeldung','Anmeldung registers actual residence; it does not authorise tourist accommodation. Gewerbeanmeldung registers a trade where applicable. Classification depends on the operation. Check with the Gewerbeamt and adviser, complete required ELSTER registration and keep receipts.',['trade']],
['Account for overnight tax','Berlin charges 7.5% of net accommodation charges, including room cleaning. Quarterly electronic returns apply from 2026, and starting or ending paid accommodation must be notified within one week. Potsdam has charged 7.5% since April 2025. Verify Airbnb collection in the host account and reconcile it.',['tax','taxGuide','potsdamTax','airTax']],
['Review VAT and profit taxes','VAT exemption does not make profits tax-free. The usual small-business limits are €25,000 prior-year turnover and €100,000 current-year turnover; the founding-year limit is €25,000. Other activities can affect eligibility. Foreign platform fees can create reverse-charge obligations, including for small businesses.',['vat','vatStart','reverse']],
['Prepare guest records and insurance','BMG §29 generally requires arrival records and ID checks for foreign guests; longer residence can trigger separate Anmeldung duties. Establish privacy and retention procedures. Ask about appropriate commercial cover, alarms and exits. AirCover is not a substitute for insurance.',['guest','insurance']]
];
export const checklist=[
'Agree the operating model, responsibilities and written partnership terms.',
'Ask the authority about the exact property and intended use.',
'Get explicit owner consent and protect yourself with a conditional lease.',
'Verify required permits, unit registration, tax setup and insurance.',
'Inspect the kitchen, bathroom, utilities, locks, exits and Wi-Fi.',
'Obtain three furnishing and cleaning quotes and update the cash plan.',
'Buy and deliver furniture only after the legal and rental position is secure.',
'Test the bed, entry process, hot water, Wi-Fi and trial turnover.',
'Create accurate listing photos, fees, rules and registration details.',
'Open a limited calendar with a local backup and review the pilot.'
];
export const landlordEN='Hello, we are JJ and Ayan, two residents of Spandau. We are looking for a property where paid short-term guest accommodation is explicitly permitted. Before a viewing, could you confirm that the owner authorises repeated short stays through Airbnb and provide evidence of the approved accommodation use and relevant permits? We would agree guest limits, quiet hours, cleaning, insurance and a local emergency contact in writing. Any lease would need to be conditional on the required public permissions and registration. Would the owner consider discussing this arrangement?';
export const landlordDE='Guten Tag, wir sind JJ und Ayan und wohnen beide in Spandau. Wir suchen eine Immobilie, in der die entgeltliche Kurzzeitbeherbergung ausdrücklich zulässig ist. Gestattet der Eigentümer wiederholte Kurzaufenthalte wechselnder Gäste über Airbnb, und liegen Nachweise zur genehmigten Nutzung sowie erforderliche Genehmigungen vor? Gästezahl, Ruhezeiten, Reinigung, Versicherung und einen örtlichen Notfallkontakt würden wir schriftlich vereinbaren. Ein Mietvertrag müsste unter dem Vorbehalt aller erforderlichen behördlichen Genehmigungen und der Registrierung stehen. Wäre der Eigentümer grundsätzlich zu einem Gespräch bereit?';
export const places:any={Berlin:[52.50,13.28,10,'all'],Spandau:[52.535,13.199,12,'Spandau'],Potsdam:[52.40,13.057,12,'Potsdam'],Charlottenburg:[52.51,13.29,12,'Charlottenburg-Wilm.'],Falkensee:[52.56,13.09,12,'Falkensee'],'Dallgow-Döberitz':[52.54,13.052,12,'Dallgow-Döberitz'],'Werder (Havel)':[52.378,12.933,12,'Werder (Havel)'],Wannsee:[52.418,13.164,12,'Steglitz - Zehlendorf']};
