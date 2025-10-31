from wagtail_draftail_anchors.rich_text import (
    anchor_identifier_entity_decorator,
    AnchorBlockConverter,
)

class DummyProps(dict):
    pass

def test_anchor_identifier_entity_decorator_creates_expected_a_tag():
    props = DummyProps(anchor="#my-anchor", children=["My anchor"])
    element = anchor_identifier_entity_decorator(props)
    # element is a draftjs_exporter.dom.DOM element representation (tag, attrs, children)
    assert element[0] == "a"
    attrs = element[1]
    assert attrs["id"] == "my-anchor"
    assert attrs["data-id"] == "my-anchor"
    assert attrs["href"] == "#my-anchor"
    assert attrs["linktype"] == "anchor-target"


def test_anchor_block_converter_sets_id():
    converter = AnchorBlockConverter("h2")
    props = {
        "block": {
            "data": {"anchor": "heading-2"},
        },
        "children": ["Heading"],
    }
    element = converter(props)
    assert element[0] == "h2"
    assert element[1]["id"] == "heading-2"
    assert element[2] == ["Heading"]
