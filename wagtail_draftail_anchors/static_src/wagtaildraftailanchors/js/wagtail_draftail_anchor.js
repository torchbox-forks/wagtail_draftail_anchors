const React = window.React;
const RichUtils = window.DraftJS.RichUtils;
const Modifier = window.DraftJS.Modifier;
const SelectionState = window.DraftJS.SelectionState;
const TooltipEntity = window.draftail.TooltipEntity;
const Icon = window.wagtail.components.Icon;
const EditorState = window.DraftJS.EditorState;
const Portal = window.wagtail.components.Portal;
const Tooltip = window.draftail.Tooltip;
import slugify from "slugify";

class AnchorIdentifierSource extends React.Component {
  componentDidMount() {
    const { editorState, entityType, onComplete } = this.props;

    const content = editorState.getCurrentContent();

    const anchor = window.prompt("Anchor identifier:");

    // Uses the Draft.js API to create a new entity with the right data.
    if (anchor) {
      const contentWithEntity = content.createEntity(
        entityType.type,
        "MUTABLE",
        {
          anchor: slugify(anchor.toLowerCase()),
        }
      );
      const entityKey = contentWithEntity.getLastCreatedEntityKey();
      const selection = editorState.getSelection();
      const nextState = RichUtils.toggleLink(editorState, selection, entityKey);

      onComplete(nextState);
    } else {
      onComplete(editorState);
    }
  }

  render() {
    return null;
  }
}

const anchorifyHeading = (content, blockKey, anchor) => {
  const blockMap = content.getBlockMap();
  // Use low-level APIs so we avoid adding to the undo/redo stack
  // or changing the selection.
  const blocks = blockMap.map((b) => {
    if (b.getKey() === blockKey) {
      const newData = new Map();
      newData.set("anchor", anchor);
      console.log(anchor, newData);
      return b.set("data", b.getData().merge(newData));
    }
    return b;
  });
  return content.merge({
    blockMap: blockMap.merge(blocks),
  });
};

const getAnchorIdentifierAttributes = (data) => {
  const url = data.anchor || null;
  let icon = <Icon name="anchor" />;
  let label = `#${url}`;

  return {
    url,
    icon,
    label,
  };
};

const AnchorIdentifier = (props) => {
  const { entityKey, contentState } = props;
  const data = contentState.getEntity(entityKey).getData();

  return <TooltipEntity {...props} {...getAnchorIdentifierAttributes(data)} />;
};

window.draftail.registerPlugin({
  type: "ANCHOR-IDENTIFIER",
  source: AnchorIdentifierSource,
  decorator: AnchorIdentifier,
});

const CopyAnchorButton = ({ identifier }) => {
  const [didCopy, setDidCopy] = React.useState(false);

  const copyText = (event) => {
    // Prevent the button click event from submitting the page form
    event.preventDefault();
    navigator.clipboard.writeText(identifier);
    setDidCopy(true);
  };

  const classes = "button button-small";
  return (
    <button
      class={classes}
      style={{ marginLeft: "1rem" }}
      aria-label="Copy anchor identifier"
      aria-live="polite"
      role="button"
      onClick={copyText}
    >
      {didCopy ? "Copied" : "Copy"}
    </button>
  );
};

class UneditableAnchorDecorator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTooltipAt: null,
    };

    this.openTooltip = this.openTooltip.bind(this);
    this.closeTooltip = this.closeTooltip.bind(this);

    // Initial setting of the anchor data.
    this.setAnchorData();
  }

  componentDidUpdate(prevProps) {
    // Conditional anchor update if the text has changed.
    this.setAnchorData(prevProps.decoratedText);
  }

  setAnchorData(oldText = null) {
    const blockKey = this.props.offsetKey.split("-")[0];
    let content = this.props.contentState;
    const block = content.getBlockForKey(blockKey);
    const hasAnchor = block.getData().has("anchor");

    const newText = this.props.decoratedText;

    if (!hasAnchor || oldText !== newText) {
      const anchor = slugify(newText.toLowerCase());
      let editorState = this.props.getEditorState();
      content = anchorifyHeading(content, blockKey, anchor);
      editorState = EditorState.set(editorState, { currentContent: content });
      this.props.setEditorState(editorState);
    }
  }

  openTooltip(e) {
    const trigger = e.target.closest("[data-draftail-trigger]");

    // Click is within the tooltip.
    if (!trigger) {
      return;
    }

    const container = trigger.closest("[data-draftail-editor-wrapper]");
    const containerRect = container.getBoundingClientRect();
    const rect = trigger.getBoundingClientRect();

    this.setState({
      showTooltipAt: {
        container: container,
        top:
          rect.top -
          containerRect.top -
          (document.documentElement.scrollTop || document.body.scrollTop),
        left:
          rect.left -
          containerRect.left -
          (document.documentElement.scrollLeft || document.body.scrollLeft),
        width: rect.width,
        height: rect.height,
      },
    });
  }

  closeTooltip() {
    this.setState({ showTooltipAt: null });
  }

  render() {
    const children = this.props.children;

    const slugified = slugify(this.props.decoratedText.toLowerCase());
    const anchor = `#${slugified}`;
    const { showTooltipAt } = this.state;

    // Contrary to what JSX A11Y says, this should be a button but it shouldn't be focusable.
    /* eslint-disable springload/jsx-a11y/interactive-supports-focus */
    return (
      <a
        href=""
        name={anchor}
        role="button"
        // Use onMouseUp to preserve focus in the text even after clicking.
        onMouseUp={this.openTooltip}
        className="TooltipEntity"
        data-draftail-trigger
      >
        <sub>
          <Icon name="anchor" className="TooltipEntity__icon" />
        </sub>
        {children}
        {showTooltipAt && (
          <Portal
            node={showTooltipAt.container}
            onClose={this.closeTooltip}
            closeOnClick
            closeOnType
            closeOnResize
          >
            <Tooltip target={showTooltipAt} direction="top">
              {anchor}
              <CopyAnchorButton identifier={slugified} />
            </Tooltip>
          </Portal>
        )}
      </a>
    );
  }
}

function headingStrategy(contentBlock, callback, contentState) {
  // Decorates all headings as a mechanism to convert them to anchors.
  if (contentBlock.getType().includes("header")) {
    callback(0, contentBlock.getLength());
  }
}

window.draftail.registerPlugin(
  {
    type: "ANCHOR-IDENTIFIER",
    strategy: headingStrategy,
    component: UneditableAnchorDecorator,
  },
  "decorators"
);
