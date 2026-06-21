import os
import pytest
import shutil
from database import JSONCollection, JSONDatabaseWrapper

@pytest.fixture
def temp_db(tmp_path):
    db_file = tmp_path / "test_ecoquest_db.json"
    yield str(db_file)
    if db_file.exists():
        db_file.unlink()

def test_json_collection_crud(temp_db):
    collection = JSONCollection(temp_db, "test_users")
    
    # 1. Test count of empty collection
    assert collection.count_documents({}) == 0
    
    # 2. Test insert_one
    user1 = {"username": "eco_user1", "level": 2, "eco_coins": 120}
    res1 = collection.insert_one(user1)
    assert res1.inserted_id is not None
    assert collection.count_documents({}) == 1
    
    # 3. Test find_one
    found = collection.find_one({"username": "eco_user1"})
    assert found is not None
    assert found["username"] == "eco_user1"
    assert found["level"] == 2
    assert found["eco_coins"] == 120
    assert "_id" in found
    
    # 4. Test insert_many
    users = [
        {"username": "eco_user2", "level": 5, "eco_coins": 80},
        {"username": "eco_user3", "level": 1, "eco_coins": 200},
        {"username": "eco_user4", "level": 5, "eco_coins": 150}
    ]
    res_many = collection.insert_many(users)
    assert len(res_many.inserted_ids) == 3
    assert collection.count_documents({}) == 4
    
    # 5. Test find with sorting and limits
    # Sort by level descending (-1), then eco_coins ascending (1)
    results = list(collection.find(sort=[("level", -1), ("eco_coins", 1)]))
    assert len(results) == 4
    # Highest levels first
    assert results[0]["username"] == "eco_user2"  # Level 5, 80 coins
    assert results[1]["username"] == "eco_user4"  # Level 5, 150 coins
    assert results[2]["username"] == "eco_user1"  # Level 2, 120 coins
    assert results[3]["username"] == "eco_user3"  # Level 1, 200 coins
    
    # Test limit
    limited = list(collection.find(limit=2))
    assert len(limited) == 2

    # 6. Test update_one
    collection.update_one({"username": "eco_user1"}, {"$set": {"level": 3}, "$inc": {"eco_coins": 10}})
    updated = collection.find_one({"username": "eco_user1"})
    assert updated["level"] == 3
    assert updated["eco_coins"] == 130
    
    # 7. Test matchers ($or and $in)
    or_matches = list(collection.find({"$or": [{"username": "eco_user2"}, {"username": "eco_user3"}]}))
    assert len(or_matches) == 2
    
    in_matches = list(collection.find({"level": {"$in": [1, 3]}}))
    assert len(in_matches) == 2  # eco_user1 (level 3) and eco_user3 (level 1)
    
    # 8. Test update_many
    collection.update_many({"level": 5}, {"$inc": {"eco_coins": 20}})
    user2 = collection.find_one({"username": "eco_user2"})
    user4 = collection.find_one({"username": "eco_user4"})
    assert user2["eco_coins"] == 100
    assert user4["eco_coins"] == 170

    # 9. Test delete_one
    del_res = collection.delete_one({"username": "eco_user3"})
    assert del_res.deleted_count == 1
    assert collection.count_documents({}) == 3
    
    # 10. Test delete_many
    del_many = collection.delete_many({"level": 5})
    assert del_many.deleted_count == 2
    assert collection.count_documents({}) == 1

def test_caching_and_file_mtime(temp_db):
    collection = JSONCollection(temp_db, "cache_test")
    collection.insert_one({"name": "doc1"})
    
    # Check that cache was populated
    assert temp_db in JSONCollection._cache
    assert "cache_test" in JSONCollection._cache[temp_db]
    
    # Modify cache directly in memory to verify it's used
    mtime, docs = JSONCollection._cache[temp_db]["cache_test"]
    fake_docs = [{"name": "fake_doc"}]
    JSONCollection._cache[temp_db]["cache_test"] = (mtime, fake_docs)
    
    # Loading should hit cache and return the fake doc
    loaded = collection._load()
    assert len(loaded) == 1
    assert loaded[0]["name"] == "fake_doc"
    
    # Change file modified time externally to simulate external edit
    stat = os.stat(temp_db)
    os.utime(temp_db, (stat.st_atime, stat.st_mtime + 5))
    
    # Loading now should miss cache and reload real file
    loaded_new = collection._load()
    assert len(loaded_new) == 1
    assert loaded_new[0]["name"] == "doc1"
