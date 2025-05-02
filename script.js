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
    // Target the new summary table container
    const tripSummaryTableDiv = document.getElementById('trip-summary-table'); // <-- Mới

    // Passenger Management elements
    const addPassengerToggleArea = document.getElementById('add-passenger-toggle-area');
    const showAddPassengerFormBtn = document.getElementById('show-add-passenger-form-btn');
    const addPassengerForm = document.getElementById('add-passenger-form');
    const cancelAddPassengerBtn = document.getElementById('cancel-add-passenger-btn');
    const passengerListDiv = document.getElementById('passenger-list');
    const currentTripIdInput = document.getElementById('current-trip-id');

    const STORAGE_KEY = 'xeGhepTrips_v5'; // Key for version 5

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

    // --- CẬP NHẬT HÀM NÀY ---
    function showTripDetailView(tripId) {
        const trip = findTripById(tripId);
        if (!trip) {
            alert('Không tìm thấy chuyến đi!');
            showTripListView();
            return;
        }

        // Update trip title
        detailTripTitle.textContent = `Chi tiết: ${trip.origin} → ${trip.destination}`;

        // --- Tạo nội dung cho bảng tóm tắt chuyến đi ---
        displayTripSummary(trip); // <-- Gọi hàm mới

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
    // --- Kết thúc showTripDetailView ---


    function showAddPassengerForm() {
        addPassengerToggleArea.classList.add('hidden');
        addPassengerForm.classList.remove('hidden');
        addPassengerForm.reset();
        addPassengerForm.querySelector('input[type="text"]')?.focus();
    }

    function hideAddPassengerForm() {
        addPassengerForm.classList.add('hidden');
        addPassengerToggleArea.classList.remove('hidden');
        addPassengerForm.reset();
    }


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

    // --- HÀM MỚI: Hiển thị bảng tóm tắt chuyến đi ---
    function displayTripSummary(trip) {
        const bookedSeats = calculateBookedSeats(trip);
        const availableSeats = trip.vehicleSeats - bookedSeats;

        let summaryHTML = `
            <div class="summary-row">
                <div class="summary-label">Ngày đi:</div>
                <div class="summary-value">${formatDate(trip.date)} lúc ${trip.time}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Loại xe:</div>
                <div class="summary-value">${trip.vehicleSeats} chỗ</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Giá / chỗ:</div>
                <div class="summary-value">${formatCurrency(trip.pricePerSeat)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Chỗ đã đặt:</div>
                <div class="summary-value"><span class="seat-booked">${bookedSeats}</span> / ${trip.vehicleSeats}</div>
            </div>
             <div class="summary-row">
                <div class="summary-label">Chỗ còn trống:</div>
                <div class="summary-value"><span class="seat-available">${availableSeats}</span></div>
            </div>
        `;

        // Chỉ thêm hàng ghi chú nếu có
        if (trip.notes) {
            summaryHTML += `
                <div class="summary-row">
                    <div class="summary-label">Ghi chú CĐ:</div>
                    <div class="summary-value"><span class="trip-notes-value">${trip.notes}</span></div>
                </div>
            `;
        }

        tripSummaryTableDiv.innerHTML = summaryHTML;
    }
    // --- Kết thúc displayTripSummary ---


    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = '';
        if (!passengers || passengers.length === 0) {
            passengerListDiv.innerHTML = '<div class="passenger-item"><p style="text-align:center; width:100%; padding: 20px;">Chưa có hành khách nào cho chuyến này.</p></div>';
            return;
        }

        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });

        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');

            // === SỬA LỖI LINK GOOGLE MAPS (Lần 2) ===
            // Sử dụng URL tìm kiếm chuẩn và ổn định nhất của Google Maps
            const mapSearchUrl = "https://www.google.com/maps/search/?api=1&query=";
            const mapLinkPickup = `${mapSearchUrl}${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `${mapSearchUrl}${encodeURIComponent(passenger.dropoffAddress)}`;
            // =========================================

            const { statusText, statusClass } = getStatusInfo(passenger.status);
            const passengerIdentifier = `data-passenger-name="${passenger.name}" data-passenger-contact="${passenger.contact}"`;

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
            passengerListDiv.appendChild(passengerElement);
        });
    }


    // === Helper Functions ===
    function calculateBookedSeats(trip) {
        return trip.passengers.reduce((sum, p) => (p.status !== 'cancelled' && p.status !== 'no_show') ? sum + p.seatsBooked : sum, 0);
    }

    // Bỏ hàm updateSeatInfo vì đã tích hợp vào displayTripSummary

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

    // 4. Show Add Passenger Form
    showAddPassengerFormBtn.addEventListener('click', showAddPassengerForm);

    // 5. Cancel Adding Passenger
    cancelAddPassengerBtn.addEventListener('click', (event) => {
        event.preventDefault();
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
                     hideAddPassengerForm();
                     return;
                 }
             }

            trips[tripIndex].passengers.push(newPassenger);
            saveTrips(trips);
            // Re-render passenger list and update summary table
            displayPassengerList(trips[tripIndex].passengers, tripId);
            displayTripSummary(trips[tripIndex]); // <-- Cập nhật bảng tóm tắt
            hideAddPassengerForm();
        } else {
             alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.');
        }
    });


     // 7. Click on Passenger List (Update Status / Delete Passenger)
     passengerListDiv.addEventListener('click', (event) => {
         const target = event.target.closest('button');
         if (!target) return;

         const tripId = target.dataset.tripId;
         const passengerName = target.dataset.passengerName;
         const passengerContact = target.dataset.passengerContact;

         if (!tripId || passengerName === undefined || passengerContact === undefined) return;

         let trips = getTrips();
         const tripIndex = trips.findIndex(t => t.id === tripId);
         if (tripIndex === -1) { console.error("Lỗi: Không tìm thấy chuyến đi."); return; }

         const passengerIndex = trips[tripIndex].passengers.findIndex(p => p.name === passengerName && p.contact === passengerContact);
         if (passengerIndex === -1) {
             console.warn("Cảnh báo: Không tìm thấy hành khách với tên và SĐT này.");
             showTripDetailView(tripId);
             return;
         }

         let needsSummaryUpdate = false; // Biến cờ để kiểm tra xem có cần cập nhật summary không

         // Handle Delete Button
         if (target.classList.contains('delete-passenger-btn')) {
             if (confirm(`Bạn có chắc muốn xóa hành khách "${passengerName}" (${passengerContact})?`)) {
                 // Chỉ cần cập nhật summary nếu khách bị xóa không phải là 'cancelled' hoặc 'no_show'
                 if (trips[tripIndex].passengers[passengerIndex].status !== 'cancelled' && trips[tripIndex].passengers[passengerIndex].status !== 'no_show') {
                     needsSummaryUpdate = true;
                 }
                 trips[tripIndex].passengers.splice(passengerIndex, 1);
                 saveTrips(trips);
                 displayPassengerList(trips[tripIndex].passengers, tripId);
                 if (needsSummaryUpdate) {
                     displayTripSummary(trips[tripIndex]); // Cập nhật summary nếu cần
                 }
             }
         }
         // Handle Status Update Button
         else if (target.classList.contains('status-update-btn')) {
             const newStatus = target.dataset.newStatus;
             const oldStatus = trips[tripIndex].passengers[passengerIndex].status;
             const validStatuses = ['booked', 'picked_up', 'dropped_off', 'cancelled', 'no_show'];

             if (newStatus && validStatuses.includes(newStatus) && newStatus !== oldStatus) {
                 // Cần cập nhật summary nếu trạng thái thay đổi từ/sang 'cancelled' hoặc 'no_show'
                 if ((oldStatus !== 'cancelled' && oldStatus !== 'no_show') !== (newStatus !== 'cancelled' && newStatus !== 'no_show')) {
                     needsSummaryUpdate = true;
                 }
                 trips[tripIndex].passengers[passengerIndex].status = newStatus;
                 saveTrips(trips);
                 displayPassengerList(trips[tripIndex].passengers, tripId);
                 if (needsSummaryUpdate) {
                     displayTripSummary(trips[tripIndex]); // Cập nhật summary nếu cần
                 }
             } else if (!newStatus || !validStatuses.includes(newStatus)) {
                 console.warn("Trạng thái mới không hợp lệ:", newStatus);
             }
         }
     });

    // === Initial Load ===
    showTripListView(); // Show the main trip list view initially

}); // End DOMContentLoaded
