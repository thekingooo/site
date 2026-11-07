"""Build the standalone site's metadata and discovery files from one configuration."""
from html import escape
import json
from urllib.parse import urljoin, urlsplit
from xml.etree import ElementTree as ET


def build_seo(config):
    url = config['url']
    parsed = urlsplit(url)
    assert parsed.scheme == 'https' and parsed.hostname and parsed.path == '/'
    assert not parsed.query and not parsed.fragment
    company_id, website_id, page_id = (url + suffix for suffix in ('#company', '#website', '#webpage'))
    image = urljoin(url, config['image'])
    graph = [
        {
            '@type': 'GeneralContractor', '@id': company_id,
            'name': config['name'], 'url': url,
            'description': config['description'],
            'logo': urljoin(url, config['logo']), 'image': image,
            'telephone': config['phones'][0], 'email': config['email'],
            'address': config['address'],
            'areaServed': {'@type': 'Country', 'name': 'Россия'},
            'contactPoint': [
                {'@type': 'ContactPoint', 'telephone': phone,
                 'contactType': 'customer service', 'availableLanguage': 'ru'}
                for phone in config['phones']
            ],
        },
        {
            '@type': 'WebSite', '@id': website_id, 'url': url,
            'name': config['name'], 'inLanguage': 'ru-RU',
            'publisher': {'@id': company_id},
        },
        {
            '@type': 'WebPage', '@id': page_id, 'url': url,
            'name': config['title'], 'description': config['description'],
            'inLanguage': 'ru-RU', 'isPartOf': {'@id': website_id},
            'about': {'@id': company_id}, 'mainEntity': {'@id': company_id},
            'primaryImageOfPage': {'@type': 'ImageObject', 'url': image,
                                   'width': config['imageWidth'], 'height': config['imageHeight']},
        },
    ]
    head = [f'<title>{escape(config["title"])}</title>',
            f'<link rel="canonical" href="{escape(url, quote=True)}">']
    def meta(attribute, name, value):
        head.append(f'<meta {attribute}="{name}" content="{escape(str(value), quote=True)}">')
    meta('name', 'description', config['description'])
    meta('name', 'robots', 'index, follow, max-image-preview:large')
    for name, value in {
        'og:type': 'website', 'og:locale': 'ru_RU', 'og:site_name': config['name'],
        'og:url': url, 'og:title': config['title'], 'og:description': config['description'],
        'og:image': image, 'og:image:type': 'image/jpeg', 'og:image:width': config['imageWidth'],
        'og:image:height': config['imageHeight'], 'og:image:alt': config['imageAlt'],
    }.items():
        meta('property', name, value)
    for name, value in {
        'twitter:card': 'summary_large_image', 'twitter:title': config['title'],
        'twitter:description': config['description'], 'twitter:image': image,
        'twitter:image:alt': config['imageAlt'],
    }.items():
        meta('name', name, value)
    # Escape '<' so a future edited value cannot close the JSON-LD script element.
    structured = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False,
                            separators=(',', ':')).replace('<', '\\u003c')
    head.append(f'<script type="application/ld+json">{structured}</script>')
    robots = f'User-agent: *\nAllow: /\n\nSitemap: {url}sitemap.xml\n'
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap = ET.Element(f'{{{namespace}}}urlset')
    entry = ET.SubElement(sitemap, f'{{{namespace}}}url')
    ET.SubElement(entry, f'{{{namespace}}}loc').text = url
    return '\n'.join(head), robots, ET.tostring(sitemap, encoding='utf-8', xml_declaration=True)
