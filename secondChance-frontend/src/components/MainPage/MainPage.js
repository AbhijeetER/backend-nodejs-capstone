import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';

function MainPage() {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    const { isLoggedIn } = useAppContext();


    const catalogRef = useRef(null);

    useEffect(() => {

        const fetchItems = async () => {
            try {
                let url = `${urlConfig.backendUrl}/api/secondchance/items`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error; ${response.status}`);
                }
                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.log('Fetch error: ' + error.message);
            }
        };

        fetchItems();
    }, []);

    const goToDetailsPage = (itemId) => {
        navigate(`/app/item/${itemId}`);
    };

    const handleAddItem = () => {
        navigate(`/app/addItem`);
    };

    const scrollToCatalog = () => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getConditionClass = (condition) => {
        return condition === "New" ? "badge bg-success" : "badge bg-warning text-dark";
    };

    return (
        <div className="main-page-wrapper">

            <div className="bg-dark text-white text-center py-5 mb-5 shadow-sm hero-section" style={{ background: 'linear-gradient(135deg, #198754 0%, #0c462c 100%)' }}>
                <div className="container py-5">

                    <h1 className="display-3 fw-bold mb-3">Second Chance</h1>


                    <p className="lead mx-auto mb-4 style-element" style={{ maxWidth: '600px', opacity: 0.9 }}>
                        Give preloved household items a new home. Connect with neighbors to exchange items, reduce waste, and build a sustainable community together.
                    </p>


                    <button
                        onClick={scrollToCatalog}
                        className="btn btn-light btn-lg px-5 py-3 fw-semibold text-success shadow"
                    >
                        Get Started
                    </button>
                </div>
            </div>


            <div className="container mt-4" ref={catalogRef}>
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <h2 className="text-secondary fw-semibold">Available Items</h2>
                    {isLoggedIn && (
                        <button onClick={handleAddItem} className="btn btn-success px-4 py-2 shadow-sm">
                            + Add New Item
                        </button>
                    )}
                </div>

                <div className="row">
                    {items.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-success mb-3" role="status"></div>
                            <p className="text-muted">Loading available items from collection...</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="col-md-4 mb-4">
                                <div className="card h-100 shadow-sm product-card border-0 rounded-3 overflow-hidden transition-all">
                                    <div className="image-placeholder bg-light d-flex align-items-center justify-content-center" style={{ height: '220px', overflow: 'hidden' }}>
                                        {item.image ? (
                                            <img
                                                src={urlConfig.backendUrl + item.image}
                                                alt={item.name}
                                                className="img-fluid w-100 h-100 object-fit-cover"
                                            />
                                        ) : (
                                            <div className="text-muted small">No Image Available</div>
                                        )}
                                    </div>
                                    <div className="card-body d-flex flex-column justify-content-between">
                                        <div>
                                            <h5 className="card-title text-dark fw-bold mb-2">{item.name}</h5>
                                            <div className="mb-3">
                                                <span className={getConditionClass(item.condition)}>
                                                    {item.condition}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="card-text text-muted small mb-0 date-added">
                                                Added on: {formatDate(item.date_added)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-white border-top-0 p-3">
                                        <button
                                            onClick={() => goToDetailsPage(item.id)}
                                            className="btn btn-outline-success w-100 rounded-2 fw-medium"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default MainPage;