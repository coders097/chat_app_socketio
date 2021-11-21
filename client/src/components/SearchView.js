import React from "react";
import "../css/SearchView.css";

function SearchView(props) {
  let {
    searchView,
    showSearchView,
    searchResults,
    setPrivateChatMode,
    setCurrentChannelId,
    setCurrentChannelName,
    setPrivateChatBoxId,
  } = props;

  return (
    <section className={searchView ? "SearchView Search-active" : "SearchView"}>
      <div className="-display">
        {searchResults.groups.length === 0 &&
        searchResults.friends.length === 0 ? (
          <h1 className="-default">Search Results Appear Here</h1>
        ) : null}
        {searchResults.groups.length !== 0 ? <h1>GROUPS</h1> : null}
        {searchResults.groups.map((group) => (
          <p
            onClick={() => {
              setPrivateChatMode(false);
              setCurrentChannelId(group._id);
              setCurrentChannelName(group.name);
            }}
            key={group._id}
          >
            #{group.name}
          </p>
        ))}
        {searchResults.friends.length !== 0 ? <h1>Users</h1> : null}
        {searchResults.friends.map((friend) => (
          <div className="item" key={friend.id}>
            <img src={`http://localhost:3100/fetch/getPic?name=${friend.pic}&userpic=true`} alt="user-pic" />
            <p
              onClick={() => {
                setPrivateChatMode(true);
                setCurrentChannelId(friend.id);
                setPrivateChatBoxId(friend.messagesId);
              }}
            >
              {friend.name}
            </p> 
          </div>
        ))}
      </div>
      <div className="-close" onClick={() => showSearchView(false)}>
        <p>
          <i className="fa fa-chevron-up" aria-hidden="true"></i>
        </p>
      </div>
    </section>
  );
}

export default SearchView;
