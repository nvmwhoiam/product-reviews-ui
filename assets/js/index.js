let allReviews = [];
let currentReviews = [];
let displayedCount = 0;
let currentFilter = null;
const reviewsPerPage = 5;

async function fetchReviews() {
    try {
        const response = await fetch('./assets/json/data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        allReviews = data.reviews;
        return data.reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

function calculateStats() {
    const totalReviews = allReviews.length;

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / totalReviews).toFixed(1);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(review => {
        breakdown[review.rating]++;
    });

    return {
        averageRating: parseFloat(averageRating),
        totalReviews: totalReviews,
        ratingBreakdown: breakdown
    };
}

async function initReviewApp() {
    await fetchReviews();

    loadInitialReviews();

    updateOverallStats();
    renderReviews();
    bindEvents();
}

function loadInitialReviews() {
    currentReviews = allReviews.slice(0, reviewsPerPage);
    displayedCount = reviewsPerPage;
}

function updateOverallStats() {
    const stats = calculateStats();

    const ratingNumber = document.querySelector('.rating-number');
    const reviewCount = document.querySelector('.review-count');

    if (ratingNumber) {
        ratingNumber.textContent = stats.averageRating;
    }

    if (reviewCount) {
        reviewCount.textContent = stats.totalReviews;
    }

    updateStarsDisplay(stats.averageRating);

    updateRatingBars(stats);
}

function updateStarsDisplay(averageRating) {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    starsContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';

        if (i <= Math.floor(averageRating)) {
            star.classList.add('filled');
        } else if (i === Math.ceil(averageRating) && averageRating % 1 !== 0) {
            star.classList.add('half');
        }

        star.textContent = '★';
        starsContainer.appendChild(star);
    }
}

function updateRatingBars(stats) {
    const breakdown = stats.ratingBreakdown;
    const total = stats.totalReviews;

    for (let i = 5; i >= 1; i--) {
        const percentage = Math.round((breakdown[i] / total) * 100);
        const bar = document.querySelector(`.rating-bar:nth-child(${6 - i}) .bar`);
        const percentageText = document.querySelector(`.rating-bar:nth-child(${6 - i}) .rating-percentage`);

        if (bar) {
            bar.style.width = `${percentage}%`;
        }

        if (percentageText) {
            percentageText.textContent = `${percentage}%`;
        }
    }
}

function filterReviewsByRating(rating) {
    currentFilter = rating;
    const filteredReviews = allReviews.filter(review => review.rating === rating);

    displayedCount = Math.min(reviewsPerPage, filteredReviews.length);
    currentReviews = filteredReviews.slice(0, displayedCount);

    updateFilterUI(rating);
    renderReviews();
    updateLoadMoreButton();
}

function clearFilter() {
    currentFilter = null;
    loadInitialReviews();
    updateFilterUI(null);
    renderReviews();
    updateLoadMoreButton();
}

function updateFilterUI(rating) {
    const filterControls = document.getElementById('filterControls');
    const filterInfo = document.getElementById('filterInfo');
    const ratingBars = document.querySelectorAll('.rating-bar');

    if (rating) {
        filterControls.style.display = 'flex';
        filterInfo.textContent = `Showing ${rating} star reviews only`;

        ratingBars.forEach(bar => {
            bar.classList.remove('active');
            if (parseInt(bar.dataset.rating) === rating) {
                bar.classList.add('active');
            }
        });
    } else {
        filterControls.style.display = 'none';

        ratingBars.forEach(bar => {
            bar.classList.remove('active');
        });
    }
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    if (currentFilter) {
        const filteredReviews = allReviews.filter(review => review.rating === currentFilter);
        if (displayedCount >= filteredReviews.length) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'All Filtered Reviews Loaded';
        } else {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More Reviews';
        }
    } else {
        if (displayedCount >= allReviews.length) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'All Reviews Loaded';
        } else {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More Reviews';
        }
    }
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    currentReviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        container.appendChild(reviewElement);
    });
}

function createReviewElement(review) {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.dataset.reviewId = review.id;

    const stars = generateStars(review.rating);
    const formattedDate = formatDate(review.date);

    reviewCard.innerHTML = `
        <div class="review-header">
            <div class="reviewer-info">
                <div class="avatar">${review.reviewer.avatar}</div>
                <div class="reviewer-details">
                    <span>${review.reviewer.name}</span>
                    <p class="review-date">${formattedDate}</p>
                </div>
            </div>
            <div class="review-rating">
                <div class="review-stars">
                    ${stars}
                </div>
                <span class="review-score">${review.rating}/5</span>
            </div>
        </div>
        <div class="review-content">
            <div class="review-title">${review.title}</div>
            <p class="review-text">${review.text}</p>
        </div>
        <div class="review-footer">
            <div class="review-helpful">
                <button class="helpful-btn" data-review-id="${review.id}">
                    👍 Helpful (${review.helpful})
                </button>
            </div>
            ${review.verified ? '<span class="verified-badge">✓ Verified Purchase</span>' : ''}
        </div>
    `;

    return reviewCard;
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="review-star filled">★</span>';
        } else {
            stars += '<span class="review-star">★</span>';
        }
    }
    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function bindEvents() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreReviews);
    }

    const clearFilterBtn = document.getElementById('clearFilterBtn');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearFilter);
    }

    const ratingBars = document.querySelectorAll('.rating-bar');
    ratingBars.forEach(bar => {
        bar.addEventListener('click', (e) => {
            const rating = parseInt(bar.dataset.rating);
            if (currentFilter === rating) {
                clearFilter();
            } else {
                filterReviewsByRating(rating);
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('helpful-btn')) {
            handleHelpfulClick(e.target);
        }
    });
}

function loadMoreReviews() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const container = document.getElementById('reviewsContainer');

    if (currentFilter) {
        const filteredReviews = allReviews.filter(review => review.rating === currentFilter);

        if (displayedCount >= filteredReviews.length) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'All Filtered Reviews Loaded';
            return;
        }

        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        setTimeout(() => {
            const nextBatch = filteredReviews.slice(
                displayedCount,
                displayedCount + reviewsPerPage
            );

            nextBatch.forEach(review => {
                const reviewElement = createReviewElement(review);
                container.appendChild(reviewElement);
            });

            displayedCount += nextBatch.length;
            currentReviews = filteredReviews.slice(0, displayedCount);

            loadMoreBtn.textContent = 'Load More Reviews';
            loadMoreBtn.disabled = false;

            if (displayedCount >= filteredReviews.length) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'All Filtered Reviews Loaded';
            }
        }, 500);
    } else {
        if (displayedCount >= allReviews.length) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'All Reviews Loaded';
            return;
        }

        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        setTimeout(() => {
            const nextBatch = allReviews.slice(
                displayedCount,
                displayedCount + reviewsPerPage
            );

            nextBatch.forEach(review => {
                const reviewElement = createReviewElement(review);
                container.appendChild(reviewElement);
            });

            displayedCount += nextBatch.length;
            currentReviews = allReviews.slice(0, displayedCount);

            loadMoreBtn.textContent = 'Load More Reviews';
            loadMoreBtn.disabled = false;

            if (displayedCount >= allReviews.length) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'All Reviews Loaded';
            }
        }, 500);
    }
}

function handleHelpfulClick(button) {
    const reviewId = parseInt(button.dataset.reviewId);
    const currentText = button.textContent;
    const currentCount = parseInt(currentText.match(/\d+/)[0]);

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        button.textContent = `👍 Helpful (${currentCount - 1})`;
    } else {
        button.classList.add('active');
        button.textContent = `👍 Helpful (${currentCount + 1})`;
    }

    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

document.addEventListener('DOMContentLoaded', () => {
    initReviewApp();
}); 