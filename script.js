document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const tripListView = document.getElementById('trip-list-view');
    const tripDetailView = document.getElementById('trip-detail-view');

    // Trip List View elements
    const addTripForm = document.getElementById('add-trip-form');
    const tripListDiv = document.getElementById('trip-list');

    // Trip Detail View elements
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailTripTitle = document.getElementById('detail-trip-title');
    const detailTripInfo = document.getElementById('detail-trip-info');
    const detailSeatInfo = document.getElementById('detail-seat-info');
    const detailTripNotes = document.getElementById('detail-trip-notes');

    // Passenger Management elements
    const addPassengerToggleArea = document.getElementById('add-passenger-toggle-area'); // Container for the button
    const showAddPassengerFormBtn = document.getElementById('show-add-passenger-form-btn'); // Button to show form
    const addPassengerForm = document.getElementById('add-passenger-form'); // The form itself
    const cancelAddPassengerBtn = document.getElementById('cancel-add-passenger-btn'); // Cancel button inside the form
    const passengerListDiv = document.getElementById('passenger-list'); // Container for passenger rows
    const currentTripIdInput = document.getElementById('current-trip-id'); // Hidden input

    const STORAGE_KEY = 'xeGhepTrips_v4'; // Key for version 4

    // === Data Handling ===
    function getTrips() {
        const tripsJson = localStorage.getItem(STORAGE_KEY);
        try {
            const trips = tripsJson ? JSON.parse(tripsJson) : [];
            trips.sort((a, b) => {
                const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`);
                const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`);
                if (isNaN(dateTimeA.getTime())) return 1;
                if (isNaN(dateTimeB.getTime())) return -1;
                return dateTimeA - dateTimeB;
            });
            return trips;
        } catch (e) {
            console.error("Lỗi parse JSON từ localStorage:", e);
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
    }

    function saveTrips(trips) {
        try {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
            alert("Đã có lỗi xảy ra khi lưu dữ liệu. LocalStorage có thể đã đầy.");
        }
    }

    function findTripById(tripId) {
        const trips = getTrips();
        return trips.find(trip => trip.id === tripId);
    }

    // === View Switching & Form Toggling ===
    function showTripListView() {
        tripDetailView.classList.add('hidden');
        tripListView.classList.remove('hidden');
        displayTrips();
        window.scrollTo(0, 0);
    }

    function showTripDetailView(tripId) {
        const trip = findTripById(tripId);
        if (!trip) {
            alert('Không tìm thấy chuyến đi!');
            showTripListView();
            return;
        }

        // Update trip details
        detailTripTitle.textContent = `Chi tiết: ${trip.origin} → ${trip.destination}`;
        detailTripInfo.innerHTML = `<strong>Ngày đi:</strong> ${formatDate(trip.date)} lúc ${trip.time}<br>
                                    <strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ`;
        if (trip.notes) {
             detailTripNotes.textContent = `Ghi chú chuyến đi: ${trip.notes}`;
             detailTripNotes.classList.remove('hidden');
        } else {
            detailTripNotes.classList.add('hidden');
        }
        updateSeatInfo(trip); // Update seat count display

        // Display passenger list (table format)
        displayPassengerList(trip.passengers, tripId);

        // Set current trip ID and reset/hide the add passenger form initially
        currentTripIdInput.value = tripId;
        hideAddPassengerForm(); // Ensure form is hidden when view loads

        // Switch views
        tripListView.classList.add('hidden');
        tripDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // --- Functions to control the add passenger form visibility ---
    function showAddPassengerForm() {
        addPassengerToggleArea.classList.add('hidden'); // Hide the "Add New" button area
        addPassengerForm.classList.remove('hidden'); // Show the form
        addPassengerForm.reset(); // Clear any previous input
        // Optionally focus the first input field
        addPassengerForm.querySelector('input[type="text"]')?.focus();
    }

    function hideAddPassengerForm() {
        addPassengerForm.classList.add('hidden'); // Hide the form
        addPassengerToggleArea.classList.remove('hidden'); // Show the "Add New" button area
        addPassengerForm.reset(); // Clear the form
    }
    // --- End form visibility functions ---


    // === Rendering Functions ===
    function displayTrips() {
        const trips = getTrips();
        tripListDiv.innerHTML = '';

        if (trips.length === 0) {
            tripListDiv.innerHTML = '<p>Chưa có chuyến đi nào được tạo.</p>';
            return;
        }

        trips.forEach(trip => {
            const tripElement = document.createElement('div');
            tripElement.classList.add('trip-item');
            tripElement.dataset.tripId = trip.id;

            const bookedSeats = calculateBookedSeats(trip);
            const availableSeats = trip.vehicleSeats - bookedSeats;
            const seatStatusColor = availableSeats <= 0 ? 'red' : (availableSeats < trip.vehicleSeats ? '#e08100' : 'green');

            tripElement.innerHTML = `
                <h3>${trip.origin} → ${trip.destination}</h3>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p>
                <p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ</p>
                <p><strong>Chỗ:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats}
                   (Còn: <span style="color: ${seatStatusColor}; font-weight: bold;">${availableSeats}</span>)
                </p>
                ${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}
                <div class="trip-actions">
                    <button class="action-button manage-btn" data-trip-id="${trip.id}">Xem & Quản lý Khách</button>
                    <button class="action-button delete-btn" data-trip-id="${trip.id}">Xóa Chuyến</button>
                </div>
            `;
            tripListDiv.appendChild(tripElement);
        });
    }

    // --- CẬP NHẬT HÀM NÀY ĐỂ RENDER BẢNG ---
    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = ''; // Clear previous list content
        if (!passengers || passengers.length === 0) {
            passengerListDiv.innerHTML = '<div class="passenger-item"><p style="text-align:center; width:100%; padding: 20px;">Chưa có hành khách nào cho chuyến này.</p></div>';
            return;
        }

        // Sort passengers by status
        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });

        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item'); // This is now a row in the table

            const mapBaseUrl = "https://www.google.com/maps/search/?api=1&query=URL_ENCODED_ADDRESS";
            const mapLinkPickup = `${mapBaseUrl}?api=1&query=${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `${mapBaseUrl}?api=1&query=${encodeURIComponent(passenger.dropoffAddress)}`;

            const { statusText, statusClass } = getStatusInfo(passenger.status);
            const passengerIdentifier = `data-passenger-name="${passenger.name}" data-passenger-contact="${passenger.contact}"`;

            // Create divs for each column matching the header structure
            passengerElement.innerHTML = `
                <div class="col-stt">${index + 1}</div>
                <div class="col-name">${passenger.name} ${passenger.notes ? `<i style="font-size:0.8em; color: #6c757d;" title="${passenger.notes}"> (ghi chú)</i>` : ''}</div>
                <div class="col-contact">
                    <a href="tel:${passenger.contact}" title="Gọi ${passenger.name}"><span class="icon icon-phone">☎</span> ${passenger.contact}</a>
                </div>
                <div class="col-seats">${passenger.seatsBooked}</div>
                <div class="col-pickup">
                    ${passenger.pickupAddress}
                    <a href="${mapLinkPickup}" target="_blank" title="Xem bản đồ điểm đón"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-dropoff">
                    ${passenger.dropoffAddress}
                    <a href="${mapLinkDropoff}" target="_blank" title="Xem bản đồ điểm trả"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-status">
                    <span class="passenger-status ${statusClass}">${statusText}</span>
                </div>
                <div class="col-actions">
                    ${passenger.status === 'booked' ? `<button class="status-update-btn btn-pickup" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="picked_up" title="Đánh dấu đã đón"><span class="icon">👍</span> Đón</button>` : ''}
                    ${passenger.status === 'picked_up' ? `<button class="status-update-btn btn-dropoff" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="dropped_off" title="Đánh dấu đã trả"><span class="icon">🏁</span> Trả</button>` : ''}
                    ${passenger.status !== 'dropped_off' && passenger.status !== 'cancelled' ? `<button class="status-update-btn btn-cancel" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="cancelled" title="Hủy chỗ của khách này"><span class="icon">❌</span> Hủy</button>` : ''}
                    ${passenger.status === 'booked' || passenger.status === 'picked_up' ? `<button class="status-update-btn btn-noshow" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="no_show" title="Đánh dấu khách không đến"><span class="icon">👻</span> Ko đến</button>` : ''}
                    <button class="delete-passenger-btn" title="Xóa khách này" data-trip-id="${tripId}" ${passengerIdentifier}><span class="icon">🗑️</span> Xóa</button>
                </div>
            `;
            // Append the row to the list container
            passengerListDiv.appendChild(passengerElement);
        });
    } // --- End displayPassengerList ---


    // === Helper Functions ===
    function calculateBookedSeats(trip) {
        return trip.passengers.reduce((sum, p) => (p.status !== 'cancelled' && p.status !== 'no_show') ? sum + p.seatsBooked : sum, 0);
    }

    // Function to update the seat info display separately
    function updateSeatInfo(trip) {
         const bookedSeats = calculateBookedSeats(trip);
         const availableSeats = trip.vehicleSeats - bookedSeats;
         detailSeatInfo.innerHTML = `<strong>Chỗ ngồi:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats} (Còn trống: <span style="color: green; font-weight: bold;">${availableSeats}</span>)`;
    }


    function formatCurrency(amount) {
        if (isNaN(amount)) return "N/A";
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function formatDate(dateString) {
         if (!dateString) return "N/A";
        try {
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
                 throw new Error("Invalid date format (YYYY-MM-DD expected)");
            }
             const date = new Date(year, month - 1, day);
             if (isNaN(date.getTime()) || date.getFullYear() !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day)) {
                 throw new Error("Invalid date value");
             }
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Lỗi định dạng ngày:", dateString, e);
            return dateString;
        }
    }

    function getStatusInfo(status) {
        switch (status) {
            case 'booked': return { statusText: 'Đã đặt', statusClass: 'status-booked' };
            case 'picked_up': return { statusText: 'Đã đón', statusClass: 'status-picked_up' };
            case 'dropped_off': return { statusText: 'Đã trả', statusClass: 'status-dropped_off' };
            case 'cancelled': return { statusText: 'Đã hủy', statusClass: 'status-cancelled' };
            case 'no_show': return { statusText: 'Không đến', statusClass: 'status-no_show' };
            default: return { statusText: status || 'N/A', statusClass: '' };
        }
    }

    // === Event Listeners ===

    // 1. Add New Trip
    addTripForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newTrip = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
            origin: document.getElementById('trip-origin').value.trim(),
            destination: document.getElementById('trip-destination').value.trim(),
            date: document.getElementById('trip-date').value,
            time: document.getElementById('trip-time').value,
            vehicleSeats: parseInt(document.getElementById('vehicle-seats').value),
            pricePerSeat: parseInt(document.getElementById('price-per-seat').value),
            notes: document.getElementById('trip-notes').value.trim(),
            passengers: []
        };

        if (!newTrip.date || formatDate(newTrip.date) === newTrip.date) {
             alert('Ngày đi không hợp lệ. Vui lòng chọn lại.');
             return;
        }
        if (!newTrip.origin || !newTrip.destination || !newTrip.time || isNaN(newTrip.vehicleSeats) || newTrip.vehicleSeats <= 0 || isNaN(newTrip.pricePerSeat)) {
            alert('Vui lòng nhập đầy đủ thông tin hợp lệ cho chuyến đi.');
            return;
        }

        const trips = getTrips();
        trips.push(newTrip);
        saveTrips(trips);
        addTripForm.reset();
        displayTrips();
    });

    // 2. Click on Trip List (Manage/Delete Trip)
    tripListDiv.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const tripId = target.dataset.tripId;
        if (!tripId) return;

        if (target.classList.contains('manage-btn')) {
            showTripDetailView(tripId);
        } else if (target.classList.contains('delete-btn')) {
            const trip = findTripById(tripId);
            const tripName = trip ? `${trip.origin} → ${trip.destination} (${formatDate(trip.date)})` : "chuyến đi này";
            if (confirm(`Bạn có chắc muốn xóa "${tripName}" và toàn bộ thông tin hành khách? Hành động này không thể hoàn tác.`)) {
                let trips = getTrips();
                trips = trips.filter(trip => trip.id !== tripId);
                saveTrips(trips);
                displayTrips();
            }
        }
    });

    // 3. Back to List from Detail View
    backToListBtn.addEventListener('click', showTripListView);

    // --- CẬP NHẬT EVENT LISTENERS CHO FORM THÊM KHÁCH ---
    // 4. Show Add Passenger Form
    showAddPassengerFormBtn.addEventListener('click', showAddPassengerForm);

    // 5. Cancel Adding Passenger
    cancelAddPassengerBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent potential form submission if type was submit
        hideAddPassengerForm();
    });

    // 6. Submit Add Passenger Form
    addPassengerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const tripId = currentTripIdInput.value;
        if (!tripId) return;
        const trip = findTripById(tripId);
        if (!trip) { alert('Lỗi: Không tìm thấy chuyến đi.'); return; }

        const passengerName = document.getElementById('passenger-name').value.trim();
        const passengerContact = document.getElementById('passenger-contact').value.trim();
        const seatsBooked = parseInt(document.getElementById('passenger-seats').value);
        const pickupAddress = document.getElementById('passenger-pickup').value.trim();
        const dropoffAddress = document.getElementById('passenger-dropoff').value.trim();
        const passengerNotes = document.getElementById('passenger-notes').value.trim();

        if (!passengerName || !passengerContact || isNaN(seatsBooked) || seatsBooked <= 0 || !pickupAddress || !dropoffAddress) {
             alert('Vui lòng nhập đầy đủ thông tin khách hàng (tên, SĐT, số chỗ, điểm đón, điểm trả).');
             return;
         }
        const currentBookedSeats = calculateBookedSeats(trip);
        if (currentBookedSeats + seatsBooked > trip.vehicleSeats) {
             alert(`Không đủ chỗ! Chỉ còn ${trip.vehicleSeats - currentBookedSeats} chỗ trống.`);
             return;
         }

        const newPassenger = {
            name: passengerName,
            contact: passengerContact,
            seatsBooked: seatsBooked,
            pickupAddress: pickupAddress,
            dropoffAddress: dropoffAddress,
            notes: passengerNotes,
            status: 'booked'
        };

        let trips = getTrips();
        const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex > -1) {
             const existingPassenger = trips[tripIndex].passengers.find(p => p.name === newPassenger.name && p.contact === newPassenger.contact && p.status !== 'cancelled');
             if (existingPassenger) {
                 if (!confirm(`Khách hàng "${newPassenger.name}" (${newPassenger.contact}) đã tồn tại trong chuyến này và chưa bị hủy. Bạn vẫn muốn thêm lượt đặt mới?`)){
                     // Không thêm, chỉ ẩn form đi
                     hideAddPassengerForm();
                     return;
                 }
             }

            trips[tripIndex].passengers.push(newPassenger);
            saveTrips(trips);
            // Re-render passenger list and update seat info
            displayPassengerList(trips[tripIndex].passengers, tripId);
            updateSeatInfo(trips[tripIndex]);
            // Hide the form after successful addition
            hideAddPassengerForm();
        } else {
             alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.');
        }
    });
    // --- KẾT THÚC EVENT LISTENERS FORM THÊM KHÁCH ---


     // 7. Click on Passenger List (Update Status / Delete Passenger)
     passengerListDiv.addEventListener('click', (event) => {
         const target = event.target.closest('button'); // Find the closest button clicked
         if (!target) return;

         const tripId = target.dataset.tripId;
         const passengerName = target.dataset.passengerName;
         const passengerContact = target.dataset.passengerContact;

         if (!tripId || passengerName === undefined || passengerContact === undefined) return;

         let trips = getTrips();
         const tripIndex = trips.findIndex(t => t.id === tripId);
         if (tripIndex === -1) { console.error("Lỗi: Không tìm thấy chuyến đi."); return; }

         // Find the correct passenger index in the original array
         const passengerIndex = trips[tripIndex].passengers.findIndex(p => p.name === passengerName && p.contact === passengerContact);
         if (passengerIndex === -1) {
             console.warn("Cảnh báo: Không tìm thấy hành khách với tên và SĐT này.");
             showTripDetailView(tripId); // Refresh view to sync
             return;
         }

         // Handle Delete Button
         if (target.classList.contains('delete-passenger-btn')) {
             if (confirm(`Bạn có chắc muốn xóa hành khách "${passengerName}" (${passengerContact})?`)) {
                 trips[tripIndex].passengers.splice(passengerIndex, 1);
                 saveTrips(trips);
                 // Re-render list and update seat info
                 displayPassengerList(trips[tripIndex].passengers, tripId);
                 updateSeatInfo(trips[tripIndex]);
             }
         }
         // Handle Status Update Button
         else if (target.classList.contains('status-update-btn')) {
             const newStatus = target.dataset.newStatus;
             const validStatuses = ['booked', 'picked_up', 'dropped_off', 'cancelled', 'no_show'];
             if (newStatus && validStatuses.includes(newStatus)) {
                 trips[tripIndex].passengers[passengerIndex].status = newStatus;
                 saveTrips(trips);
                  // Re-render list and update seat info
                 displayPassengerList(trips[tripIndex].passengers, tripId);
                 updateSeatInfo(trips[tripIndex]);
             } else {
                 console.warn("Trạng thái mới không hợp lệ:", newStatus);
             }
         }
     });

    // === Initial Load ===
    showTripListView(); // Show the main trip list view initially

}); // End DOMContentLoaded
