import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {Alert, InputGroup, FormControl, Container, Card, Spinner, Button, Badge, ListGroup} from "react-bootstrap"
import axios from "axios";
// @ts-ignore
import * as throttle from "lodash.throttle";
// @ts-ignore
import * as delay from "lodash.delay";

// @ts-ignore
import * as escapeRegexp from "lodash.escaperegexp";

const APIUri = "/api/issues";

interface Issue {
    title: string;
    url: string;
    labels: Record<string, string>[];
}

interface SearchResponse {
    items: Issue[]
}

const openInNewTab = (url: any) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null
};

// keyboard idle DELAY before running api call
const DELAY = 400;

const Search = (props: any) => {
    const [active, setActive] = useState(-1);
    const [items, setItems] = useState([]);
    const [visibleItems, setVisibleItems] = useState([]);
    const [showAlert, setShowAlert] = useState(false);

    const [isShow, setIsShow] = useState(false);
    const [input, setInput] = useState("");
    const [timer, setTimer] = useState(null);
    const [loading, setLoading] = useState(false);


    // filter items when input or items change
    useEffect(() => {
        if (input.trim().length === 0) {
            setVisibleItems([]);
            return
        }
        const filtered = items
            .filter((i) =>
                i.title.toLowerCase().indexOf(input.toLowerCase()) >= 0)
            .sort((a, b) =>
                a.title.toLowerCase().indexOf(input.toLowerCase())
                < b.title.toLowerCase().indexOf(input.toLowerCase()) ? -1 : 1
            );
        setVisibleItems(filtered);
    }, [input, items]);

    const apiCall = async (e: any, currItems: any[]) => {
        // @ts-ignore
        const value = e.target.value;
        const conf = {
            params: {
                q: value
            }
        };

        setLoading(true);
        try {
            const issues: any = await axios.get(APIUri, conf);
            const {items: suggestions} = issues.data;
            setActive(null);
            if (suggestions.length) {
                currItems = suggestions;
            }
        } catch (err) {
            setLoading(false);
            if (err.response?.status === 403) setShowAlert(true);
            return
        }
        setItems(currItems);
        setIsShow(true);
        setLoading(false);
    };

    // call api at most every 800 ms
    const apiCallRef = useRef(throttle(apiCall, 800, {trailing: true}));

    // Highlight input in issues
    const highlightInput = (issue: Issue, text: string) => {
        const parts = issue.title.split(new RegExp(`(${escapeRegexp(text)})`, 'gi'));
        return <span> {parts.map((part, i) =>
            <span key={i} style={part.toLowerCase() === text.toLowerCase() ? {fontWeight: 'bold'} : {}}>
            {part}
        </span>)
        } </span>;
    };

    const alert = () => {
        if (showAlert) {
            return (
                <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
                    <Alert.Heading>API rate limit exceeded</Alert.Heading>
                    <p>
                        Wait a moment and try again.
                    </p>
                </Alert>
            );
        } else {
            return <div style={{minHeight: "106px"}}></div>
        }
    };

    const onChange = (e: any) => {
        // @ts-ignore
        apiCallRef.current.cancel();
        const input = e.target.value;
        setInput(input);

        // Only query when idle for 800ms
        clearTimeout(timer);
        setTimer(delay((ev: any, itms: any[]) => {
            apiCallRef.current(ev, itms);
        }, DELAY, e, items));
    };
    const onClick = (e: any) => {
        console.log(visibleItems.length);
        if (visibleItems.length === 0) {
            return
        }
        const i = visibleItems[active || 0];
        openInNewTab(i.url);
        setActive(null);
        setItems([]);
        setIsShow(false);
        // @ts-ignore
        setInput("")

    };
    const onKeyPressed = (e: any) => {
        if (e.keyCode === 13) { // enter key
            onClick(e);
        } else if (e.keyCode === 38) { // up arrow
            return (active === 0) ? setActive(null) : setActive(active - 1);
        } else if (e.keyCode === 40) { // down arrow
            const newActive = active === null ? -1 : active;
            return (newActive - 1 === items.length) ? null : setActive(newActive + 1);
        }
    };

    const showItems = () => {
        if (isShow && input) {
            if (visibleItems.length) {
                return (
                    <ListGroup>
                        {visibleItems.map((suggestion, index) => {
                            let className;
                            if (index === active) {
                                className = "active";
                            }
                            return (
                                <ListGroup.Item
                                    className={className}
                                    key={index}
                                    onClick={onClick}>
                                    {highlightInput(suggestion, input)}
                                    <div>
                                        {suggestion.labels.map((s: any) => {
                                            return (
                                                <Badge
                                                    className={'badge badge-pill badge-light'}
                                                    style={{marginRight: "2px", backgroundColor: s.color}}
                                                    key={s.id}>
                                                    {s.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                );
            } else {
                return (
                    <div className="no-autocomplete">
                        <em>Not found</em>
                    </div>
                );
            }
        }
        return <></>;
    };

    let findButton;
    if (!loading) {
        findButton = <Button style={{minWidth: "150px"}} variant="outline-primary" className="find"
            onClick={onClick}> Open </Button>
    } else {
        findButton = <Button style={{minWidth: "150px"}} className="find" variant="primary" disabled>
            <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
            />Searching...</Button>
    }
    return (
        <span onKeyDown={onKeyPressed}>
    <Container className="home">
        <div className="container-fluid">
            {alert()}
            <h4 className="section-title">Find React Issues</h4>
          <div>
            <Card className="mb-3">
              <div className="card-body">
                <div className="card-text"></div>
                <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                  {findButton}
                  </InputGroup.Prepend>
                  <FormControl placeholder={"search"}
                      value={input}
                      onChange={onChange}/>
                </InputGroup>
                  {showItems()}
              </div>
            </Card>
          </div>
        </div>
    </Container>
          </span>
    )
};
export default Search;
