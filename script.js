document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    // ... (giữ nguyên các khai báo element cũ) ...
    const passengerListDiv = document.getElementById('passenger-list');
    // ...

    const STORAGE_KEY = 'xeGhepTrips_v3'; // Đổi key để tránh xung đột data cũ

    // === Data Handling ===
    // ... (getTrips, saveTrips, findTripById giữ nguyên) ...

    // === View Switching ===
    // ... (showTripListView, showTripDetailView giữ nguyên logic chuyển view) ...
    //     (nhưng showTripDetailView sẽ gọi displayPassengerList đã được cập nhật)

    function showTripDetailView(tripId) {
        const trip = findTripById(tripId);
        // ... (phần cập nhật thông tin chuyến đi giữ nguyên) ...

        // Hiển thị danh sách hành khách (đã được cải tiến)
        displayPassengerList(trip.passengers, tripId); // <-- Gọi hàm mới

        // ... (phần đặt tripId và reset form giữ nguyên) ...
        // ... (phần chuyển view giữ nguyên) ...
    }

    // === Rendering Functions ===
    // ... (displayTrips giữ nguyên) ...

    // === CẬP NHẬT HÀM NÀY ===
    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = ''; // Xóa danh sách cũ
        if (!passengers || passengers.length === 0) {
            passengerListDiv.innerHTML = '<p>Chưa có hành khách nào cho chuyến này.</p>';
            return;
        }

        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');
            passengerElement.dataset.passengerIndex = index; // Lưu index để thao tác

            // Tạo link Google Maps (cần encode địa chỉ)
            const mapLinkPickup = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passenger.dropoffAddress)}`;

            // Lấy text và class cho trạng thái
            const { statusText, statusClass } = getStatusInfo(passenger.status);

            passengerElement.innerHTML = `
                <div class="passenger-header">
                    <h4>${index + 1}. ${passenger.name} - ${passenger.seatsBooked} chỗ</h4>
                    <button class="delete-passenger-btn" title="Xóa khách này" data-trip-id="${tripId}" data-passenger-index="${index}">Xóa Khách</button>
                </div>

                <div class="passenger-details">
                    <p><strong>SĐT:</strong> <a href="tel:${passenger.contact}" title="Gọi ${passenger.name}"><span class="icon icon-phone">&#x260E;</span> ${passenger.contact}</a></p>
                    <p><strong>Đón:</strong> <span class="address-pickup">${passenger.pickupAddress}</span> <a href="${mapLinkPickup}" target="_blank" title="Xem bản đồ điểm đón"><span class="icon icon-map">&#x1F4CD;</span></a></p>
                    <p><strong>Trả:</strong> <span class="address-dropoff">${passenger.dropoffAddress}</span> <a href="${mapLinkDropoff}" target="_blank" title="Xem bản đồ điểm trả"><span class="icon icon-map">&#x1F4CD;</span></a></p>
                    <p><strong>Trạng thái:</strong> <span class="passenger-status ${statusClass}">${statusText}</span></p>
                </div>

                ${passenger.notes ? `<div class="passenger-notes"><strong>Ghi chú:</strong> ${passenger.notes}</div>` : ''}

                <div class="passenger-actions">
                    ${passenger.status === 'booked' ? `<button class="status-update-btn btn-pickup" data-trip-id="${tripId}" data-passenger-index="${index}" data-new-status="picked_up">Đã Đón</button>` : ''}
                    ${passenger.status === 'picked_up' ? `<button class="status-update-btn btn-dropoff" data-trip-id="${tripId}" data-passenger-index="${index}" data-new-status="dropped_off">Đã Trả</button>` : ''}
                    ${passenger.status !== 'dropped_off' && passenger.status !== 'cancelled' ? `<button class="status-update-btn btn-cancel" data-trip-id="${tripId}" data-passenger-index="${index}" data-new-status="cancelled">Hủy chỗ</button>` : ''}
                    ${passenger.status === 'booked' || passenger.status === 'picked_up' ? `<button class="status-update-btn btn-noshow" data-trip-id="${tripId}" data-passenger-index="${index}" data-new-status="no_show">Không đến</button>` : ''}
                 </div>
            `;
            passengerListDiv.appendChild(passengerElement);
        });
    } // --- Kết thúc hàm displayPassengerList ---

    // === Helper Functions ===
    // ... (calculateBookedSeats, formatCurrency, formatDate giữ nguyên) ...

    // Hàm lấy text và class CSS cho trạng thái
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

    // ... (addTripForm submit giữ nguyên) ...
    // ... (tripListDiv click listener giữ nguyên) ...
    // ... (backToListBtn click listener giữ nguyên) ...

    // === CẬP NHẬT HÀM NÀY ===
    // 4. Thêm hành khách mới
    addPassengerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const tripId = currentTripIdInput.value;
        if (!tripId) return;
        const trip = findTripById(tripId);
        if (!trip) { alert('Lỗi: Không tìm thấy chuyến đi.'); return; }

        // ... (lấy thông tin khách từ form giữ nguyên) ...
        const passengerName = document.getElementById('passenger-name').value.trim();
        const passengerContact = document.getElementById('passenger-contact').value.trim();
        const seatsBooked = parseInt(document.getElementById('passenger-seats').value);
        const pickupAddress = document.getElementById('passenger-pickup').value.trim();
        const dropoffAddress = document.getElementById('passenger-dropoff').value.trim();
        const passengerNotes = document.getElementById('passenger-notes').value.trim();

        // ... (kiểm tra input và kiểm tra số chỗ còn lại giữ nguyên) ...
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
            status: 'booked' // <-- Thêm trạng thái mặc định là 'Đã đặt'
        };

        // Cập nhật chuyến đi và lưu
        let trips = getTrips();
        const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex > -1) {
            trips[tripIndex].passengers.push(newPassenger);
            saveTrips(trips);
            showTripDetailView(tripId); // Hiển thị lại để cập nhật
            addPassengerForm.reset();
        } else {
             alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.');
        }
    });

    // === CẬP NHẬT HÀM NÀY ===
    // 5. Xử lý các nút trong danh sách khách hàng (Xóa khách, Cập nhật trạng thái)
    passengerListDiv.addEventListener('click', (event) => {
        const target = event.target;
        const tripId = target.dataset.tripId;
        const passengerIndex = parseInt(target.dataset.passengerIndex);

        if (isNaN(passengerIndex) || !tripId) return; // Bỏ qua nếu không có index hoặc tripId

        let trips = getTrips();
        const tripIndex = trips.findIndex(t => t.id === tripId);

        if (tripIndex === -1 || !trips[tripIndex].passengers || !trips[tripIndex].passengers[passengerIndex]) {
            console.error("Không tìm thấy chuyến đi hoặc hành khách hợp lệ.");
            return;
        }

        // 5a. Xử lý nút Xóa Khách
        if (target.classList.contains('delete-passenger-btn')) {
            const passengerName = trips[tripIndex].passengers[passengerIndex].name;
            if (confirm(`Bạn có chắc muốn xóa hành khách "${passengerName}"?`)) {
                trips[tripIndex].passengers.splice(passengerIndex, 1); // Xóa khách
                saveTrips(trips);
                showTripDetailView(tripId); // Cập nhật hiển thị
            }
        }
        // 5b. Xử lý nút Cập nhật Trạng thái
        else if (target.classList.contains('status-update-btn')) {
            const newStatus = target.dataset.newStatus;
            if (newStatus) {
                trips[tripIndex].passengers[passengerIndex].status = newStatus;
                saveTrips(trips);
                showTripDetailView(tripId); // Cập nhật hiển thị
            }
        }
    }); // --- Kết thúc passengerListDiv click listener ---

    // === Initial Load ===
    showTripListView(); // Hiển thị view chính khi tải trang

}); // End DOMContentLoaded
