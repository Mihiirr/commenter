// Code to enable the extension's features
console.log('Content script loaded');
document.addEventListener('click', function (event) {
    console.log('Click detected:', event.target);
});

// Function to create and inject the icon
function injectIcon(commentBox) {
    try {
        if (!commentBox || commentBox.querySelector('#myExtensionIcon')) {
            return; // Exit if the commentBox is invalid or the icon already exists
        }
        // Only proceed if the comment box is found
        if (commentBox) {
            // Create the icon element
            const iconElement = document.createElement('img');
            iconElement.src = chrome.runtime.getURL('icons/comments.png');
            iconElement.style.cursor = 'pointer';
            iconElement.id = 'myExtensionIcon';
            iconElement.style.cursor = 'pointer';
            iconElement.style.width = '20px';
            iconElement.style.height = '20px';
            iconElement.style.margin = '10px';
            // Add more styling as needed

            // Function to extract post content
            function getPostContent(commentBox) {
                try {
                    const parentDiv = document.querySelector('.update-components-text.relative.update-components-update-v2__commentary');

                    if (parentDiv) {
                        // Navigate through the nested spans
                        // First, find the 'span' with class 'breakdown'
                        const breakdownSpan = parentDiv.querySelector('.break-words');

                        if (breakdownSpan) {
                            // Then, find the innermost 'span' with 'dir=ltr' within 'breakdownSpan'
                            const targetSpan = breakdownSpan.querySelector('span span[dir="ltr"]');

                            return targetSpan ? targetSpan.textContent.trim() : '';
                        } else {
                            console.error('Breakdown span not found');
                            return '';
                        }
                    } else {
                        console.error('Parent div not found');
                        return '';
                    }
                    // // You'll need to adjust the selector based on LinkedIn's post structure
                    // const postContainer = eventTarget.closest('.linkedin-post-selector');
                    // return postContainer ? postContainer.textContent.trim() : '';
                } catch (error) {
                    console.error('Error extracting post content:', error);
                    return '';
                }
            }

            // Function to create and show the popup
            function showPopup(eventTarget) {
                console.log("showPopup")
                const popup = document.createElement('div');
                popup.id = 'myExtensionPopup';
                popup.style.position = 'absolute';
                popup.style.border = '1px solid #ccc';
                popup.style.backgroundColor = "#ffffff"
                popup.style.display = "flex";
                popup.style.flexDirection = "column"
                popup.style.padding = '10px';
                popup.style.borderRadius = '5px';
                popup.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                popup.style.zIndex = '999999';
                const iconRect = iconElement.getBoundingClientRect();
                popup.style.top = `${iconRect.bottom + window.scrollY}px`;
                popup.style.left = `${iconRect.left + window.scrollX}px`;

                // Extract the content of the LinkedIn post
                const postContent = getPostContent(eventTarget);

                const tones = ['Happy', 'Sad', 'Angry', 'Appreciative', 'Curious'];
                const toneDescriptions = {
                    'Happy': 'Express a positive and cheerful sentiment.',
                    'Sad': 'Show empathy or sadness.',
                    'Angry': 'Convey frustration or disagreement.',
                    'Appreciative': 'Show gratitude or appreciation.',
                    'Curious': 'Ask a question or express curiosity.'
                };
                tones.forEach(tone => {
                    const toneButton = document.createElement('button');
                    toneButton.textContent = tone;
                    toneButton.setAttribute('title', toneDescriptions[tone]);
                    toneButton.style.padding = "5px"
                    toneButton.style.width = "100%"
                    toneButton.addEventListener('mouseover', function () {
                        this.style.backgroundColor = '#e0e0e0'; // Example hover color

                    });

                    toneButton.addEventListener('mouseout', function () {
                        this.style.backgroundColor = ''; // Revert to original style
                    });

                    // Click event for tone buttons
                    toneButton.addEventListener('click', function () {
                        getCommentSuggestion(postContent, tone.toLowerCase())
                            .then(suggestedCommentText => {
                                chrome.storage.local.get('activeCommentBoxId', function (data) {
                                    const commentBoxId = data.activeCommentBoxId;
                                    const commentBox = document.getElementById(commentBoxId);
                                    if (commentBox) {
                                        const suggestedComment = commentBox.querySelector('.ql-editor');
                                        suggestedComment.innerHTML = `<p>${suggestedCommentText}</p>`;
                                        commentBox.classList.remove('ql-blank');
                                        commentBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
                                    }
                                    popup.style.display = 'none';
                                });
                            })
                            .catch(error => console.error('Error getting comment suggestion:', error));
                    });
                    // Function to call the AI service API
                    // Replace this with your actual API call implementation
                    async function getCommentSuggestion(postContent, tone) {
                        // This is a placeholder. You'll need to implement the actual API call here.
                        return `Suggested comment based on tone '${tone}' for post: ${postContent}`;
                    }
                    popup.appendChild(toneButton);
                    document.body.appendChild(popup);
                });

                // document.addEventListener('click', function (event) {
                //     if (popup && !popup.contains(event.target)) {
                //         popup.style.display = 'none';
                //     }
                // });
            }
            // Append the icon to the comment box
            commentBox.appendChild(iconElement);
            iconElement.addEventListener('click', function (event) {
                showPopup(event.target);
                const commentBoxId = this.closest('.comments-comment-box.comments-comment-box--has-avatar').getAttribute('id');
                chrome.storage.local.set({ 'activeCommentBoxId': commentBoxId });

            });
        }
    } catch (error) {
        console.error('Error in injectIcon function:', error);
    }
}
// Use MutationObserver to monitor dynamically added comment boxes
const observer = new MutationObserver(function (mutations) {
    try {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(function (node) {
                    // Check if the added node is a comment box or contains one
                    if (node.matches && node.matches('.display-flex.mlA')) {
                        injectIcon(node);
                    } else if (node.querySelectorAll) {
                        const commentBoxes = node.querySelectorAll('.display-flex.mlA');
                        commentBoxes.forEach(injectIcon);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in MutationObserver:', error);
    }
});

// Start observing the document body for added nodes
observer.observe(document.body, { childList: true, subtree: true });

// Optional: Disconnect observer when not needed to improve performance
// observer.disconnect();

// Function to handle dynamic loading
function handleDynamicLoading() {
    try {
        // Use MutationObserver or setInterval to watch for changes in the DOM
        // and call injectIcon when necessary
        // Example with setInterval:
        setInterval(() => {
            if (!document.getElementById('myExtensionIcon')) {
                injectIcon();
            }
        }, 1000); // Check every 1000 milliseconds (1 second)
    } catch (error) {
        console.error('Error in handleDynamicLoading:', error);
    }
}

// Call the function to start the process
handleDynamicLoading();